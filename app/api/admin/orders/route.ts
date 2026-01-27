import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// GET all orders for admin dashboard
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH to update order status - updates a single order by its unique database id
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["New", "Processing", "Delivered"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    // Update only the specific order matching the unique id
    const { data, error } = await supabase
      .from("orders")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", orderId)
      .select()
      .single()

    if (error) {
      console.error("Error updating order status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ order: data })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
