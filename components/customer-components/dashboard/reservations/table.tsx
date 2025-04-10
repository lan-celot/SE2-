// This is the updated part of your useEffect in the ReservationsTable component
// that needs to be modified to handle both service data structures

useEffect(() => {
  const user = auth.currentUser;
  if (!user) {
    console.log("User is not authenticated");
    setIsLoading(false);
    return;
  }

  console.log("User is authenticated, fetching reservations...");
  setIsLoading(true);
  const bookingsCollectionRef = collection(db, "bookings");
  const q = query(bookingsCollectionRef, where("userId", "==", user.uid));

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    if (snapshot.empty) {
      console.log("No reservations found");
      setReservations([]);
      setIsLoading(false);
      return;
    }

    const reservationList: Reservation[] = snapshot.docs.map((doc) => {
      const booking = doc.data();
      const id = doc.id;
      const reservationDate = booking.reservationDate || "";
      const formattedReservationDate = reservationDate ? formatDate(reservationDate) : "N/A";
      
      // Determine completion date based on status
      let completionDate = booking.completionDate && booking.completionDate !== "Pending"
        ? formatDateTime(booking.completionDate)
        : "Pending";

      // Safely handle status conversion
      const status = booking.status ? String(booking.status).toUpperCase() : "PENDING";

      // If status is COMPLETED and completion date is still Pending, generate a new completion date
      if (status === "COMPLETED" && completionDate === "Pending") {
        completionDate = generateCompletionDate();
      }

      // Handle services array, checking for both individual services and the services array
      let services: Service[] = [];
      
      // First check if there's a serviceDetails array in the booking (from the new structure)
      if (Array.isArray(booking.serviceDetails)) {
        services = booking.serviceDetails.map((service: any) => ({
          mechanic: service?.mechanic || "TO BE ASSIGNED",
          service: service?.service || "Unknown Service",
          status: service?.status || "Pending", 
          created: service?.created || "N/A",
          createdTime: service?.createdTime || "",
          reservationDate: service?.reservationDate || formattedReservationDate,
          serviceId: service?.serviceId || `legacy-${Math.random().toString(36).substring(2, 9)}`
        }));
      } 
      // Then check if there's a services array with objects (from the old structure)
      else if (Array.isArray(booking.services) && booking.services.length > 0) {
        // Check if the first item is an object with service property (service objects)
        if (booking.services[0] && typeof booking.services[0] === 'object' && booking.services[0].service) {
          services = booking.services.map((service: any) => ({
            mechanic: service?.mechanic || "TO BE ASSIGNED",
            service: service?.service || "Unknown Service",
            status: service?.status || "Pending", 
            created: service?.created || "N/A",
            createdTime: service?.createdTime || "",
            reservationDate: service?.reservationDate || formattedReservationDate,
            serviceId: service?.serviceId || `legacy-${Math.random().toString(36).substring(2, 9)}`
          }));
        } 
        // If services contains strings (service names), convert them to service objects
        else {
          services = booking.services.map((serviceName: string) => ({
            mechanic: "TO BE ASSIGNED",
            service: serviceName,
            status: "Confirmed", 
            created: booking.createdAt ? formatDateTime(booking.createdAt).split(',')[0] : "N/A",
            createdTime: booking.createdAt ? formatDateTime(booking.createdAt).split(',')[1]?.trim() : "",
            reservationDate: formattedReservationDate,
            serviceId: `legacy-${Math.random().toString(36).substring(2, 9)}`
          }));
        }
      }
      
      return {
        id: id,
        userId: booking.userId || user.uid,
        reservationDate: formattedReservationDate,
        carModel: booking.carModel ? `${booking.carModel}`.replace(/\s+/g, ' ') : "N/A",
        completionDate: completionDate,
        status: status,
        services: services,
        statusUpdatedAt: booking.statusUpdatedAt || null,
        createdAt: booking.createdAt ? formatDateTime(booking.createdAt) : "N/A"
      };
    });

    // Rest of your code remains the same...