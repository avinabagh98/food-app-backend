const { success, error } = require('../utils/response');
const { AppError } = require('../utils/errors');
const RestaurantService = require('../services/restaurant.service');

class RestaurantController {
  async getRestaurant(req, res, next) {
    try {
      const restaurant = await RestaurantService.getRestaurantDetails();
      return success(res, restaurant, 'Restaurant details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateRestaurant(req, res, next) {
    try {
      const updatedRestaurant = await RestaurantService.updateRestaurantDetails(req.body);
      return success(res, updatedRestaurant, 'Restaurant details updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RestaurantController();
