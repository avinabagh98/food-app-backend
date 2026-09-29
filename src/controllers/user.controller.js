const UserService = require('../services/user.service');
const { success, error } = require('../utils/response');
const { AppError } = require('../utils/errors');

class UserController {
  async updateMe(req, res, next) {
    try {
      const userId = req.user.userId;
      const updatedUser = await UserService.updateProfile(userId, req.body);
      return success(res, updatedUser, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async getAddresses(req, res, next) {
    try {
      const userId = req.user.userId;
      const addresses = await UserService.getUserAddresses(userId);
      return success(res, addresses, 'Addresses retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async addAddress(req, res, next) {
    try {
      const { label, address_details, latitude, longitude } = req.body;
      if (!label || !address_details || latitude === undefined || longitude === undefined) {
        throw new AppError('Label, address details, latitude and longitude are required', 400);
      }
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new AppError('Latitude and longitude must be valid numbers', 400);
      }

      const address = await UserService.addAddress(req.user.userId, req.body);
      return success(res, address, 'Address added successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateAddress(req, res, next) {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;

      if (latitude !== undefined || longitude !== undefined) {
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          throw new AppError('Latitude and longitude must be valid numbers', 400);
        }
      }

      const updatedAddress = await UserService.updateAddress(req.user.userId, id, req.body);
      return success(res, updatedAddress, 'Address updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      const { id } = req.params;
      await UserService.deleteAddress(req.user.userId, id);
      return success(res, null, 'Address deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
