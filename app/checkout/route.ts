// Replace the current POST function with this stricter version
export async function POST(request: Request) {
  try {
    const input = await request.json();
    const supabase = createAdminClient();
    const orderId = generateOrderId(); // Uses your existing generator

    const orderData = {
      order_id: orderId,
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone || null,
      photos: input.uploadedPhotos || [],
      photo_count: input.uploadedPhotos?.length || 0,
      music_selection: input.musicSelection,
      branding: input.branding,
      voiceover: input.voiceover || false,
      voiceover_script: input.voiceoverScript || null,
      status: "New",
      payment_status: "pending",
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      // Change: Return an error so the UI can tell you what happened
      return NextResponse.json({ 
        success: false, 
        error: `Database save failed: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { orderId: orderId, _id: data.id }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
