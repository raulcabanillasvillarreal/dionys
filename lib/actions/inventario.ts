'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// New tables (inventory_items, inventory_movements, purchase_orders,
// purchase_order_items) are not yet in generated types/supabase.ts —
// cast to `any` until types are regenerated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any

async function getHotelId(): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', 'hotel')
    .single()
  if (error || !data) throw new Error('Hotel business not found')
  return data.id
}

export async function getItems() {
  const supabase = db()
  const businessId = await getHotelId()

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)
    .order('name')

  if (error) return { error: error.message }
  return data ?? []
}

export async function upsertItem(formData: FormData) {
  const supabase = db()
  const businessId = await getHotelId()
  const id = formData.get('id') as string | null

  const item = {
    business_id: businessId,
    name: (formData.get('name') as string).trim(),
    category: (formData.get('category') as string) || null,
    unit: (formData.get('unit') as string) || null,
    stock: formData.get('stock') ? parseFloat(formData.get('stock') as string) : 0,
    min_stock: formData.get('min_stock') ? parseFloat(formData.get('min_stock') as string) : 0,
    cost_price: formData.get('cost_price') ? parseFloat(formData.get('cost_price') as string) : null,
    supplier: (formData.get('supplier') as string) || null,
  }

  const { error } = id
    ? await supabase.from('inventory_items').update(item).eq('id', id)
    : await supabase.from('inventory_items').insert(item)

  if (error) return { error: error.message }
  revalidatePath('/hotel/inventario')
  return { ok: true }
}

export async function deleteItem(id: string) {
  const supabase = db()

  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/hotel/inventario')
  return { ok: true }
}

export async function addMovement(
  itemId: string,
  type: 'entrada' | 'salida' | 'ajuste',
  quantity: number,
  unitCost?: number,
  reason?: string
) {
  const supabase = db()
  const businessId = await getHotelId()

  const { error: movError } = await supabase.from('inventory_movements').insert({
    item_id: itemId,
    business_id: businessId,
    type,
    quantity,
    unit_cost: unitCost ?? null,
    reason: reason ?? null,
  })

  if (movError) return { error: movError.message }

  const { data: item, error: fetchError } = await supabase
    .from('inventory_items')
    .select('stock')
    .eq('id', itemId)
    .single()

  if (fetchError || !item) return { error: fetchError?.message ?? 'Item no encontrado' }

  const currentStock: number = item.stock ?? 0
  let newStock: number

  if (type === 'entrada') {
    newStock = currentStock + quantity
  } else if (type === 'salida') {
    newStock = Math.max(0, currentStock - quantity)
  } else {
    // ajuste: set to absolute value
    newStock = quantity
  }

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ stock: newStock })
    .eq('id', itemId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/hotel/inventario')
  return { ok: true, newStock }
}

export async function getMovements(itemId?: string) {
  const supabase = db()
  const businessId = await getHotelId()

  let query = supabase
    .from('inventory_movements')
    .select('*, item:inventory_items(name, unit)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (itemId) {
    query = query.eq('item_id', itemId)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return data ?? []
}

export async function getLowStockItems() {
  const supabase = db()
  const businessId = await getHotelId()

  // Supabase JS SDK doesn't support column-to-column comparisons,
  // so fetch all items and filter client-side.
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)

  if (error) return { error: error.message }

  return (data ?? []).filter(
    (item: { stock: number | null; min_stock: number | null }) =>
      (item.stock ?? 0) <= (item.min_stock ?? 0)
  )
}

export async function createPurchaseOrder(formData: FormData) {
  const supabase = db()
  const businessId = await getHotelId()

  const itemsJson = formData.get('items') as string
  let items: { item_id: string; item_name: string; quantity: number; unit_price: number }[] = []

  try {
    items = JSON.parse(itemsJson)
  } catch {
    return { error: 'Items JSON inválido' }
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      business_id: businessId,
      supplier: (formData.get('supplier') as string).trim(),
      status: (formData.get('status') as string) || 'borrador',
      expected_date: (formData.get('expected_date') as string) || null,
      notes: (formData.get('notes') as string) || null,
      total,
    })
    .select('id')
    .single()

  if (orderError) return { error: orderError.message }

  if (items.length > 0) {
    const orderItems = items.map(item => ({
      order_id: order.id,
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }))

    const { error: itemsError } = await supabase.from('purchase_order_items').insert(orderItems)
    if (itemsError) return { error: itemsError.message }
  }

  revalidatePath('/hotel/inventario')
  return { ok: true, orderId: order.id }
}
