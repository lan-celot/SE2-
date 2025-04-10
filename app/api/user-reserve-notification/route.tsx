import { NextResponse } from "next/server";
import notificationapi from "notificationapi-node-server-sdk";

const clientID = process.env.NEXT_PUBLIC_NOTIFICATION_CLIENT_ID || "";
const secretID = process.env.NEXT_PUBLIC_NOTIFICATION_SECRET_ID || "";

notificationapi.init(clientID, secretID);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    notificationapi.send({
      notificationId: "new_booking",
      user: {
        id: "admin1"
      },
      mergeTags: {
        comment: body.comment,
        commentID: body.commentID,
      },
    });

    const response = "";

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
