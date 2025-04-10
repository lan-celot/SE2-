import { NextResponse } from "next/server"
import notificationapi from "notificationapi-node-server-sdk"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_NOTIFICATION_CLIENT_ID || !process.env.NOTIFICATION_SECRET_ID) {
      console.error("Missing notification API credentials")
      return NextResponse.json({ success: false, error: "Missing API credentials" }, { status: 500 })
    }

    console.log("Initializing NotificationAPI with:", { 
      clientId: process.env.NEXT_PUBLIC_NOTIFICATION_CLIENT_ID?.substring(0, 5) + "...",
      secretExists: !!process.env.NOTIFICATION_SECRET_ID
    })

    // Initialize the notification API with correct env vars
    notificationapi.init(
      process.env.NEXT_PUBLIC_NOTIFICATION_CLIENT_ID, 
      process.env.NOTIFICATION_SECRET_ID  // Updated variable name
    )

    // Log what we're trying to send for debugging
    console.log("Sending notification:", {
      notificationId: "new_booking",
      userId: "admin1",
      comment: body.comment,
      commentId: body.commentId || ""
    })

    // Send notification with proper data structure
    await notificationapi.send({
      notificationId: "new_booking",
      user: {
        id: "admin1", // Admin receives notifications about new bookings
      },
      mergeTags: {
        comment: body.comment || "New booking received",
        commentId: body.commentId || "",
      },
    })

    console.log("Notification sent successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification error:", error)
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}