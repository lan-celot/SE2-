import { NextResponse } from 'next/server';
import notificationapi from 'notificationapi-node-server-sdk'

notificationapi.init(
    'owvp6sijxsgcijmqlu69gzfgcs', // If using .env, replace this with your clientId env variable
    'a0w2yydeotd8e5p4u9qp9i4g4y6p38lzryla30i7b4e7nrr1r21590efl5', // If using .env, replace this with your clientSecret env variable
  )

export async function POST(req: Request){
    try{
        const body = await req.json();

        const response = await notificationapi.send({
            notificationId: 'new_booking',
            user: {
                id: "leorafael.macaya.cics@ust.edu.ph",
                email: "leorafael.macaya.cics@ust.edu.ph",
                number: "+15005550006" // Replace with your phone number, use format [+][country code][area code][local number]
            },
            mergeTags: {
                "comment": "testComment",
                "commentId": "testCommentId"
            }
        });

        return NextResponse.json({ success: true, response });
    } catch (error){
        console.error("Notification error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}