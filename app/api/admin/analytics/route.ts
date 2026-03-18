import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { isAdmin: admin } = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const supabase = createAdminClient();

    const [ordersRes, blogsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, total_price, created_at, delivered_at, customer_email, brokerage_id, photos, resolution, orientation, referral_code")
        .not("status", "eq", "pending_payment")
        .order("created_at", { ascending: false }),
      supabase
        .from("blog_posts")
        .select("id, title, slug, view_count, status, created_at")
        .order("view_count", { ascending: false })
        .limit(10),
    ]);

    if (ordersRes.error) throw ordersRes.error;

    const allOrders = ordersRes.data || [];
    const blogs = blogsRes.data || [];
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const completedStatuses = ["complete", "delivered", "closed", "approved", "awaiting_approval"];
    const pipelineStatuses = ["new", "processing", "awaiting_approval", "revision_requested", "client_revision_requested"];

    // Revenue
    const totalRevenue = allOrders.reduce((s: number, o: any) => s + (o.total_price || 0), 0);

    const thisMonthOrders = allOrders.filter((o: any) => new Date(o.created_at) >= thisMonthStart);
    const thisMonthRevenue = thisMonthOrders.reduce((s: number, o: any) => s + (o.total_price || 0), 0);

    const lastMonthOrders = allOrders.filter((o: any) => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const lastMonthRevenue = lastMonthOrders.reduce((s: number, o: any) => s + (o.total_price || 0), 0);

    const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

    // Orders by status
    const statusCounts: Record<string, number> = {};
    allOrders.forEach((o: any) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    // Pipeline
    const inPipeline = allOrders.filter((o: any) => pipelineStatuses.includes(o.status)).length;
    const errorOrders = allOrders.filter((o: any) => o.status === "error").length;
    const completed = allOrders.filter((o: any) => completedStatuses.includes(o.status)).length;

    // Avg delivery time
    const deliveredWithTime = allOrders.filter((o: any) => o.delivered_at && o.created_at);
    let avgDeliveryHours = 0;
    if (deliveredWithTime.length > 0) {
      const totalHours = deliveredWithTime.reduce((s: number, o: any) => {
        const created = new Date(o.created_at).getTime();
        const delivered = new Date(o.delivered_at).getTime();
        return s + (delivered - created) / 3600000;
      }, 0);
      avgDeliveryHours = totalHours / deliveredWithTime.length;
    }

    // Customers
    const uniqueEmails = new Set(allOrders.map((o: any) => o.customer_email?.toLowerCase()).filter(Boolean));
    const emailCounts: Record<string, number> = {};
    allOrders.forEach((o: any) => {
      const email = o.customer_email?.toLowerCase();
      if (email) emailCounts[email] = (emailCounts[email] || 0) + 1;
    });
    const repeatCustomers = Object.values(emailCounts).filter((c) => c > 1).length;

    // Splits
    const brokerageOrders = allOrders.filter((o: any) => o.brokerage_id).length;
    const referralOrders = allOrders.filter((o: any) => o.referral_code).length;
    const res1080 = allOrders.filter((o: any) => o.resolution === "1080P").length;

    // Total clips processed
    const totalClips = allOrders.reduce((s: number, o: any) => s + (o.photos?.length || 0), 0);

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const monthOrders = allOrders.filter((o: any) => {
        const c = new Date(o.created_at);
        return c >= d && c <= end;
      });
      monthlyRevenue.push({
        month: label,
        revenue: monthOrders.reduce((s: number, o: any) => s + (o.total_price || 0), 0),
        orders: monthOrders.length,
      });
    }

    return NextResponse.json({
      success: true,
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        avgOrderValue,
        monthlyTrend: monthlyRevenue,
      },
      orders: {
        total: allOrders.length,
        thisMonth: thisMonthOrders.length,
        lastMonth: lastMonthOrders.length,
        statusCounts,
        completed,
        inPipeline,
        errors: errorOrders,
      },
      pipeline: {
        avgDeliveryHours,
        totalClips,
        res1080,
        res768: allOrders.length - res1080,
        brokerageOrders,
        referralOrders,
      },
      customers: {
        total: uniqueEmails.size,
        repeat: repeatCustomers,
        new: uniqueEmails.size - repeatCustomers,
      },
      blogs: blogs.map((b: any) => ({
        title: b.title,
        slug: b.slug,
        views: b.view_count || 0,
        status: b.status,
      })),
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
