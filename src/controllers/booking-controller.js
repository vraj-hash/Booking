const { BookingService } = require("../services/index");

const bookingService = new BookingService();
const { StatusCodes } = require("http-status-codes");

const create = async (req, res) => {
  try {
    const response = await bookingService.createBooking(req.body);
    return res.status(StatusCodes.OK).json({
      message: "Successfully completed Booking",
      success: true,
      err: {},
      data: response,
    });
  } catch (error) {
    console.log("Booking Controller Error:", error);

    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: error.message || "Something went wrong",
        data: {},
        err: error.explanation || error,
      });
  }
};

module.exports = {
  create,
};
