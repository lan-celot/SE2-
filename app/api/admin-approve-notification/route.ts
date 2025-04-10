import { NextResponse } from "next/server"
import notificationapi from "notificationapi-node-server-sdk"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface NotificationRequest {
  comment: string;
  userId: string; // This is now expected to be the document ID from the users collection
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as NotificationRequest;

    // Log incoming request for debugging
    console.log("Admin notification request body:", body);

    // Validate required parameters
    if (!body.userId) {
      console.error("Missing userId in notification request");
      return NextResponse.json({ 
        success: false, 
        error: "Missing userId in request" 
      }, { status: 400 });
    }

    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_NOTIFICATION_CLIENT_ID || !process.env.NOTIFICATION_SECRET_ID) {
      console.error("Missing notification API credentials");
      return NextResponse.json({ 
        success: false, 
        error: "Missing API credentials" 
      }, { status: 500 });
    }

    // Try to get the user's authUid from Firestore if needed
    let authUid = body.userId; // Default to the passed userId

    // Fetch the user document to get the authUid if needed
    try {
      const userDoc = await getDoc(doc(db, "users", body.userId));
      
      if (userDoc.exists()) {
        // If the document exists and has an authUid field, use that
        const userData = userDoc.data();
        if (userData.authUid) {
          authUid = userData.authUid;
          console.log(`Found authUid for user ${body.userId}: ${authUid}`);
        }
      } else {
        console.log(`User document ${body.userId} not found, using original userId`);
      }
    } catch (error) {
      console.error("Error fetching user document:", error);
      // Continue with the original userId if there's an error
    }

    // Initialize the notification API with correct env vars
    notificationapi.init(
      process.env.NEXT_PUBLIC_NOTIFICATION_CLIENT_ID, 
      process.env.NOTIFICATION_SECRET_ID
    );

    // Log what we're trying to send for debugging
    console.log("Sending notification:", {
      notificationId: "approve_booking",
      userId: authUid,
      comment: body.comment
    });

    // Send notification to the specific user ID
    await notificationapi.send({
      notificationId: "approve_booking",
      user: {
        id: authUid, // Use the authUid we determined
      },
      mergeTags: {
        comment: body.comment || "Your booking status has been updated",
      },
    });

    console.log("Notification sent successfully to user:", authUid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}