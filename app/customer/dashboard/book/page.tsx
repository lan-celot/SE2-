import { BookingContent } from "@/components/customer-components/dashboard/book/booking-content"

import notificationapi from 'notificationapi-node-server-sdk'

notificationapi.init(
  'owvp6sijxsgcijmqlu69gzfgcs', // If using .env, replace this with your clientId env variable
  'a0w2yydeotd8e5p4u9qp9i4g4y6p38lzryla30i7b4e7nrr1r21590efl5', // If using .env, replace this with your clientSecret env variable
)

notificationapi.send({
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
})

export default function BookPage() {
  return (
    <div className="p-6">
      <div className="text-2xl font-bold text-[#1a365d] mb-6"></div> {/* Empty h2 */}
      <BookingContent />
    </div>
  )
}

