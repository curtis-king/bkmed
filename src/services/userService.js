const BaseService = require('./baseService');
const { User, Role } = require('../models');
const { Op } = require('sequelize');

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  async getAllPaginated(query) {
    const { search, role, page = 1, limit = 20 } = query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { dossier_number: { [Op.like]: `%${search}%` } },
      ];
    }

    const include = {
      model: Role,
      ...(role ? { where: { name: role } } : {}),
    };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.findAndCountAll({
      where,
      include,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    const totalPages = Math.ceil(users.count / parseInt(limit));
    const mapped = users.rows.map((u) => {
      const data = u.toJSON();
      return {
        ...data,
        roles: data.Roles ? data.Roles.map((r) => r.name) : [],
        Roles: undefined,
      };
    });

    return { users: mapped, total: users.count, page: parseInt(page), totalPages };
  }

  async createWithRoles(body) {
    const { roles, password, ...fields } = body;
    const roleNames = Array.isArray(roles) ? roles : roles ? [roles] : [];

    const email = fields.email;
    const phone = fields.phone;

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) throw new Error('Cet email est déjà utilisé.');
    }

    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) throw new Error('Ce numéro de téléphone est déjà utilisé.');
    }

    const safePassword = password || 'Medconnect@2025';
    const user = await User.create({
      ...fields,
      password: safePassword,
      is_active: true,
      dossier_number: `ADM-${(fields.first_name?.[0] || '').toUpperCase()}${(fields.last_name?.[0] || '').toUpperCase()}-${Date.now()}`,
    });

    if (roleNames.length > 0) {
      const foundRoles = await Role.findAll({ where: { name: roleNames } });
      await user.setRoles(foundRoles);
    } else {
      const rolePatient = await Role.findOne({ where: { name: 'PATIENT' } });
      await user.addRole(rolePatient);
    }

    return this.getByIdWithRoles(user.id);
  }

  async getByIdWithRoles(id) {
    const user = await User.findByPk(id, {
      include: Role,
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new Error('Utilisateur introuvable.');
    const data = user.toJSON();
    data.roles = data.Roles ? data.Roles.map((r) => r.name) : [];
    delete data.Roles;
    return data;
  }

  async updateWithRoles(id, body) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('Utilisateur introuvable.');

    const { roles, password, ...fields } = body;
    await user.update(fields);

    if (roles) {
      const foundRoles = await Role.findAll({ where: { name: roles } });
      await user.setRoles(foundRoles);
    }

    return this.getByIdWithRoles(id);
  }

  async addRole(userId, roleId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Utilisateur introuvable.');
    const role = await Role.findByPk(roleId);
    if (!role) throw new Error('Rôle introuvable.');
    await user.addRole(role);
  }

  async removeRole(userId, roleId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Utilisateur introuvable.');
    const role = await Role.findByPk(roleId);
    if (!role) throw new Error('Rôle introuvable.');
    await user.removeRole(role);
  }

  async getByRoleWithAvailability(role) {
    const where = {};
    if (role) {
      const roleInst = await Role.findOne({ where: { name: role } });
      if (roleInst) {
        const users = await roleInst.getUsers({
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'availability', 'photo_profile'],
        });
        return users.map((u) => u.toJSON());
      }
      return [];
    }
    return User.findAll({
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'availability', 'photo_profile'],
    });
  }
}

module.exports = new UserService();
