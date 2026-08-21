import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function test() {
  const { data, error } = await supabase.from('bookings').insert([{
    ref: "test",
    guest: "test",
    email: "test@test.com",
    phone: "123",
    room: "room",
    roomSlug: "room",
    roomType: "room",
    check_in: "2026-08-01",
    check_out: "2026-08-02",
    guests: 1,
    nights: 1,
    extras: [],
    subtotal: 10,
    tax: 1,
    total: 11,
    paymentMethod: "chapa",
    status: "pending",
    source: "direct"
  }]).select('*')
  console.log('Error:', error)
  console.log('Keys:', data?.[0] ? Object.keys(data[0]) : 'no data')
}

test()
