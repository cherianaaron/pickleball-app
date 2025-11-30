import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      success: false,
      message: "❌ Missing environment variables",
      details: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "✅ Set" : "❌ Missing",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "✅ Set" : "❌ Missing",
      },
      hint: "Create a .env.local file in your project root with your Supabase credentials",
    }, { status: 500 });
  }

  // Check if still using placeholder values
  if (supabaseUrl.includes("your-") || supabaseAnonKey.includes("your-")) {
    return NextResponse.json({
      success: false,
      message: "❌ Placeholder values detected",
      hint: "Replace the placeholder values in .env.local with your actual Supabase credentials",
    }, { status: 500 });
  }

  try {
    // Test connection using fetch to Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "✅ Supabase connection successful!",
        url: supabaseUrl,
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        message: "❌ Supabase connection failed",
        status: response.status,
        error: errorText,
      }, { status: response.status });
    }
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: "❌ Connection failed",
      error: err instanceof Error ? err.message : "Unknown error",
      hint: "Check your NEXT_PUBLIC_SUPABASE_URL",
    }, { status: 500 });
  }
}
