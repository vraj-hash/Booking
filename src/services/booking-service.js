const axios = require("axios");
const { BookingRepository } = require("../repository/index");
const { FLIGHT_SERVICE_PATH } = require("../config/server-config");
const { StatusCodes } = require("http-status-codes");
const { ServiceError } = require("../utils/errors");

class BookingService {
  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  async createBooking(data) {
    try {
      const flightId = data.flightId;
      const getFlightReqUrl = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;

      const flightResponse = await axios.get(getFlightReqUrl);
      const flightData = flightResponse.data.data;

      if (!flightData) {
        throw new ServiceError(
          "Flight not found",
          `No flight found with id ${flightId}`,
          StatusCodes.NOT_FOUND
        );
      }

      if (data.noOfSeats > flightData.totalSeats) {
        throw new ServiceError(
          "Booking failed",
          "Insufficient seats available",
          StatusCodes.BAD_REQUEST
        );
      }

      const totalCost = flightData.price * data.noOfSeats;
      const bookingPayload = { ...data, totalCost };
      const booking = await this.bookingRepository.create(bookingPayload);

      // Update remaining seats in flight service
      const updateFlightRequestUrl = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
      await axios.patch(updateFlightRequestUrl, {
        totalSeats: flightData.totalSeats - data.noOfSeats,
      });
      const finalBooking = await this.bookingRepository.update(booking.id, {
        status: "Booked",
      });
      return finalBooking;
    } catch (error) {
      // Handle validation errors from Sequelize
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "ValidationError"
      ) {
        const explanation = error.errors
          ? error.errors.map((e) => e.message).join(", ")
          : error.message;
        throw new ServiceError(
          "Validation failed",
          explanation,
          StatusCodes.BAD_REQUEST
        );
      }

      // Axios or other errors
      if (error.isAxiosError) {
        throw new ServiceError(
          "Flight service error",
          error.message,
          StatusCodes.BAD_GATEWAY
        );
      }

      // Generic service error
      console.error("Booking Service Error:", error);
      throw new ServiceError();
    }
  }
}

module.exports = BookingService;
