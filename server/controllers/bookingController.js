const prisma = require("../config/prisma");
const resend = require("../config/resend");

const validStatuses = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

const sendNewBookingEmail = async (booking) => {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: [process.env.BOOKING_NOTIFICATION_EMAIL],
    replyTo: booking.email,
    subject: `New booking request — ${booking.service}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: auto; color: #181818;">
        <div style="background: #111111; color: #ffffff; padding: 28px;">
          <p style="margin: 0 0 8px; color: #aaaaaa; font-size: 12px; letter-spacing: 2px;">
            REFAAT'S VISION
          </p>

          <h1 style="margin: 0; font-size: 28px;">
            New booking request
          </h1>
        </div>

        <div style="border: 1px solid #dddddd; border-top: 0; padding: 28px;">
          <p>
            <strong>Name:</strong>
            ${escapeHtml(booking.name)}
          </p>

          <p>
            <strong>Email:</strong>
            <a href="mailto:${escapeHtml(booking.email)}">
              ${escapeHtml(booking.email)}
            </a>
          </p>

          <p>
            <strong>Phone:</strong>
            ${escapeHtml(booking.phone)}
          </p>

          <p>
            <strong>Service:</strong>
            ${escapeHtml(booking.service)}
          </p>

          <p>
            <strong>Event date:</strong>
            ${escapeHtml(formatDate(booking.eventDate))}
          </p>

          <p>
            <strong>Location:</strong>
            ${escapeHtml(booking.location)}
          </p>

          <p>
            <strong>Budget:</strong>
            ${escapeHtml(booking.budget || "Not provided")}
          </p>

          <div style="margin-top: 24px; padding: 18px; background: #f5f5f5;">
            <strong>REFAAT'S VISION</strong>

            <p style="margin-bottom: 0; white-space: pre-wrap;">
              ${escapeHtml(
                booking.message ||
                  "No additional message provided"
              )}
            </p>
          </div>

          <p style="margin-top: 24px; color: #777777; font-size: 13px;">
            Booking ID: ${escapeHtml(booking.id)}
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const sendBookingStatusEmail = async (booking) => {
  const confirmed = booking.status === "CONFIRMED";

  const subject = confirmed
    ? `Your booking request has been confirmed — ${booking.service}`
    : `Update regarding your booking request — ${booking.service}`;

  const heading = confirmed
    ? "Your project is confirmed"
    : "An update on your request";

  const statusColor = confirmed ? "#17632d" : "#8e2222";
  const statusBackground = confirmed ? "#cef0d8" : "#f3cccc";

  const mainMessage = confirmed
    ? `
      Thank you for choosing Refaat's Vision. Your booking request
      has been confirmed. We will contact you shortly to discuss
      the project, schedule and remaining details.
    `
    : `
      Thank you for considering Refaat's Vision for your project.
      Unfortunately, we are unable to confirm this booking request
      at this time. You are welcome to contact us or submit another
      request for a different date.
    `;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: [booking.email],
    replyTo: process.env.BOOKING_NOTIFICATION_EMAIL,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: auto; color: #181818;">
        <div style="background: #111111; color: #ffffff; padding: 28px;">
          <p style="margin: 0 0 8px; color: #aaaaaa; font-size: 12px; letter-spacing: 2px;">
            REFAAT'S VISION
          </p>

          <h1 style="margin: 0; font-size: 28px;">
            ${heading}
          </h1>
        </div>

        <div style="border: 1px solid #dddddd; border-top: 0; padding: 28px;">
          <p style="font-size: 17px;">
            Hello ${escapeHtml(booking.name)},
          </p>

          <p style="line-height: 1.7;">
            ${mainMessage}
          </p>

          <div style="margin: 28px 0; padding: 20px; background: #f5f5f5;">
            <p style="margin-top: 0;">
              <strong>Service:</strong>
              ${escapeHtml(booking.service)}
            </p>

            <p>
              <strong>Event date:</strong>
              ${escapeHtml(formatDate(booking.eventDate))}
            </p>

            <p>
              <strong>Location:</strong>
              ${escapeHtml(booking.location)}
            </p>

            <p style="margin-bottom: 0;">
              <strong>Status:</strong>

              <span style="
                display: inline-block;
                margin-left: 6px;
                padding: 5px 9px;
                color: ${statusColor};
                background: ${statusBackground};
                font-size: 12px;
                font-weight: bold;
              ">
                ${escapeHtml(booking.status)}
              </span>
            </p>
          </div>

          ${
            booking.adminNotes
              ? `
                <div style="margin: 24px 0; padding: 18px; border-left: 3px solid #111111;">
                  <strong>Additional note</strong>

                  <p style="margin-bottom: 0; white-space: pre-wrap; line-height: 1.6;">
                    ${escapeHtml(booking.adminNotes)}
                  </p>
                </div>
              `
              : ""
          }

          <p style="margin-bottom: 0; line-height: 1.7;">
            Best regards,<br />
            <strong>Mohammed Refaat</strong>
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Public: submit a booking
const createBooking = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      service,
      eventDate,
      location,
      budget,
      message,
    } = req.body || {};

    if (
      !name ||
      !email ||
      !phone ||
      !service ||
      !eventDate ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, service, event date, and location are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const parsedDate = new Date(eventDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid event date",
      });
    }

    if (parsedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "The event date must be in the future",
      });
    }

    const booking = await prisma.booking.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        service: service.trim(),
        eventDate: parsedDate,
        location: location.trim(),
        budget: budget?.trim() || null,
        message: message?.trim() || null,
      },
    });

    let emailSent = false;
    let emailId = null;

    try {
      const emailResult = await sendNewBookingEmail(booking);

      emailSent = true;
      emailId = emailResult?.id || null;
    } catch (emailError) {
      console.error(
        "New booking email failed:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Booking request submitted successfully",
      data: {
        booking,
        emailSent,
        emailId,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit booking request",
    });
  }
};

// Admin: view all bookings
const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      const normalizedStatus = status.toUpperCase();

      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be PENDING, CONFIRMED, CANCELLED, or COMPLETED",
        });
      }

      where.status = normalizedStatus;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve bookings",
    });
  }
};

// Admin: view one booking
const getBookingById = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve booking",
    });
  }
};

// Admin: update status or notes
const updateBooking = async (req, res) => {
  try {
    const { status, adminNotes } = req.body || {};

    let normalizedStatus;

    if (status !== undefined) {
      normalizedStatus = String(status).toUpperCase();

      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be PENDING, CONFIRMED, CANCELLED, or COMPLETED",
        });
      }
    }

    const existingBooking = await prisma.booking.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = await prisma.booking.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...(normalizedStatus !== undefined && {
          status: normalizedStatus,
        }),

        ...(adminNotes !== undefined && {
          adminNotes: adminNotes?.trim() || null,
        }),
      },
    });

    const statusChanged =
      normalizedStatus !== undefined &&
      normalizedStatus !== existingBooking.status;

    const shouldEmailClient =
      statusChanged &&
      ["CONFIRMED", "CANCELLED"].includes(booking.status);

    let clientEmailSent = false;
    let clientEmailId = null;
    let clientEmailError = null;

    if (shouldEmailClient) {
      try {
        const emailResult =
          await sendBookingStatusEmail(booking);

        clientEmailSent = true;
        clientEmailId = emailResult?.id || null;
      } catch (emailError) {
        clientEmailError = emailError.message;

        console.error(
          "Client booking status email failed:",
          emailError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: {
        booking,
        clientEmailSent,
        clientEmailId,
        clientEmailError,
      },
    });
  } catch (error) {
    console.error("Update booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update booking",
    });
  }
};

// Admin: delete booking
const deleteBooking = async (req, res) => {
  try {
    const existingBooking = await prisma.booking.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    await prisma.booking.delete({
      where: {
        id: req.params.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Delete booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete booking",
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};