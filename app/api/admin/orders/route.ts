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

// PATCH to update order status
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] PATCH /api/admin/orders - Request body:", body)
    
    const { orderId, status } = body

    if (!orderId || !status) {
      console.log("[v0] Missing orderId or status")
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["New", "Processing", "Delivered"]
    if (!validStatuses.includes(status)) {
      console.log("[v0] Invalid status value:", status)
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    console.log("[v0] Creating admin client...")
    const supabase = createAdminClient()
    
    console.log("[v0] Updating order status in database...")
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
      console.error("[v0] Error updating order status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Order status updated successfully:", data)
    return NextResponse.json({ order: data })
  } catch (error) {
    console.error("[v0] Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
