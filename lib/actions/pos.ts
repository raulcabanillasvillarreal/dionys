'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// New tables (pos_categories, pos_products, pos_orders, pos_order_items,
// room_charges) and new columns (folio_total) are not yet in generated
// types/supabase.ts — cast to `any` until types are regenerated.
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

export async function getPosCategories() {
  const supabase = db()
  const businessId = await getHotelId()

  const { data, error } = await supabase
    .from('pos_categories')
    .select('*')
    .eq('business_id', businessId)
    .order('position')

  if (error) return { error: error.message }
  return data ?? []
}

export async function getPosProducts(categoryId?: string) {
  const supabase = db()
  const businessId = await getHotelId()

  let query = supabase
    .from('pos_products')
    .select('*, category:pos_categories(name, color)')
    .eq('business_id', businessId)
    .eq('active', true)
    .order('name')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return data ?? []
}

export async function createOrder(
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    discount?: number
  }[],
  paymentMethod: string,
  roomId?: string,
  notes?: string
) {
  const supabase = db()
  const businessId = await getHotelId()

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice - (item.discount ?? 0),
    0
  )
  const discount = items.reduce((sum, item) => sum + (item.discount ?? 0), 0)
  const total = subtotal

  // Find active reservation for the room if roomId provided
  let reservationId: string | null = null
  if (roomId) {
    const today = new Date().toISOString().split('T')[0]
    const { data: res } = await supabase
      .from('reservations')
      .select('id, folio_total')
      .eq('room_id', roomId)
      .eq('status', 'confirmada')
      .lte('check_in', today)
      .gte('check_out', today)
      .maybeSingle()

    if (res) reservationId = res.id
  }

  const { data: order, error: orderError } = await supabase
    .from('pos_orders')
    .insert({
      business_id: businessId,
      room_id: roomId ?? null,
      reservation_id: reservationId,
      status: 'paid',
      subtotal,
      discount,
      total,
      payment_method: paymentMethod,
      notes: notes ?? null,
    })
    .select('id')
    .single()

  if (orderError) return { error: orderError.message }

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    discount: item.discount ?? 0,
    subtotal: item.quantity * item.unitPrice - (item.discount ?? 0),
  }))

  const { error: itemsError } = await supabase.from('pos_order_items').insert(orderItems)
  if (itemsError) return { error: itemsError.message }

  // Decrement stock for each product
  for (const item of items) {
    const { data: product } = await supabase
      .from('pos_products')
      .select('stock')
      .eq('id', item.productId)
      .single()

    if (product) {
      await supabase
        .from('pos_products')
        .update({ stock: Math.max(0, (product.stock ?? 0) - item.quantity) })
        .eq('id', item.productId)
    }
  }

  // If linked to a reservation, add charges to the room folio
  if (reservationId) {
    for (const item of items) {
      const lineTotal = item.quantity * item.unitPrice - (item.discount ?? 0)
      await supabase.from('room_charges').insert({
        reservation_id: reservationId,
        business_id: businessId,
        description: `POS: ${item.productName} x${item.quantity}`,
        amount: lineTotal,
        payment_method: paymentMethod,
      })
    }

    const { data: current } = await supabase
      .from('reservations')
      .select('folio_total')
      .eq('id', reservationId)
      .single()

    await supabase
      .from('reservations')
      .update({ folio_total: (current?.folio_total ?? 0) + total })
      .eq('id', reservationId)
  }

  revalidatePath('/hotel/pos')
  revalidatePath('/hotel/mapa')
  return { ok: true, orderId: order.id }
}

export async function getOrders(date?: string) {
  const supabase = db()
  const businessId = await getHotelId()
  const targetDate = date ?? new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pos_orders')
    .select('*, items:pos_order_items(*)')
    .eq('business_id', businessId)
    .gte('created_at', `${targetDate}T00:00:00`)
    .lte('created_at', `${targetDate}T23:59:59`)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return data ?? []
}

export async function updateProductStock(
  productId: string,
  quantity: number,
  type: 'add' | 'subtract'
) {
  const supabase = db()

  const { data: product, error: fetchError } = await supabase
    .from('pos_products')
    .select('stock')
    .eq('id', productId)
    .single()

  if (fetchError || !product) return { error: fetchError?.message ?? 'Producto no encontrado' }

  const currentStock = product.stock ?? 0
  const newStock =
    type === 'add' ? currentStock + quantity : Math.max(0, currentStock - quantity)

  const { error } = await supabase
    .from('pos_products')
    .update({ stock: newStock })
    .eq('id', productId)

  if (error) return { error: error.message }
  revalidatePath('/hotel/pos')
  return { ok: true, newStock }
}
