const { Op } = require('sequelize');
const {
  PermissionDefinition,
  PermissionGroup,
  PermissionGroupItem
} = require('../models');
const { SYSTEM_GROUPS } = require('../constants/permissions');

class PermissionController {
  async getDefinitions(req, res) {
    const definitions = await PermissionDefinition.findAll({
      order: [['module', 'ASC'], ['key', 'ASC']]
    });

    res.json({
      success: true,
      data: { definitions }
    });
  }

  async getGroups(req, res) {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const q = (req.query.q || '').trim();
    const offset = (page - 1) * limit;

    const where = {};
    if (q) {
      where.name = { [Op.like]: `%${q}%` };
    }

    const { count, rows } = await PermissionGroup.findAndCountAll({
      where,
      include: [
        {
          model: PermissionGroupItem,
          as: 'groupItems',
          include: [{ model: PermissionDefinition, as: 'permissionDefinition' }]
        }
      ],
      order: [['is_system', 'DESC'], ['name', 'ASC']],
      limit,
      offset
    });

    const groups = rows.map((group) => {
      const permissions = (group.groupItems || []).map((item) => ({
        permission_definition_id: item.permission_definition_id,
        key: item.permissionDefinition?.key,
        module: item.permissionDefinition?.module
      }));
      return {
        permission_group_id: group.permission_group_id,
        name: group.name,
        is_default: group.is_default,
        is_system: group.is_system,
        created_by: group.created_by,
        permissions
      };
    });

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  }

  async createGroup(req, res) {
    const { name, permission_definition_ids = [] } = req.body;
    const existing = await PermissionGroup.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Group name already exists' });
    }

    const group = await PermissionGroup.create({
      name,
      is_default: false,
      is_system: false,
      created_by: req.user.user_id
    });

    if (permission_definition_ids.length > 0) {
      await PermissionGroupItem.bulkCreate(
        permission_definition_ids.map((id) => ({
          permission_group_id: group.permission_group_id,
          permission_definition_id: id
        }))
      );
    }

    res.status(201).json({
      success: true,
      message: 'Permission group created successfully',
      data: { group }
    });
  }

  async updateGroup(req, res) {
    const groupId = parseInt(req.params.id, 10);
    const { name, permission_definition_ids = [] } = req.body;
    const group = await PermissionGroup.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Permission group not found' });
    }

    if (group.is_system && group.name === SYSTEM_GROUPS.ADMIN_FULL_ACCESS) {
      return res.status(400).json({
        success: false,
        message: 'Admin full access group cannot be modified'
      });
    }

    if (name && name !== group.name) {
      const existing = await PermissionGroup.findOne({ where: { name } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Group name already exists' });
      }
    }

    await group.update({ name: name || group.name });
    await PermissionGroupItem.destroy({ where: { permission_group_id: group.permission_group_id } });

    if (permission_definition_ids.length > 0) {
      await PermissionGroupItem.bulkCreate(
        permission_definition_ids.map((id) => ({
          permission_group_id: group.permission_group_id,
          permission_definition_id: id
        }))
      );
    }

    res.json({
      success: true,
      message: 'Permission group updated successfully'
    });
  }

  async setDefaultGroup(req, res) {
    const groupId = parseInt(req.params.id, 10);
    const group = await PermissionGroup.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Permission group not found' });
    }

    if (group.name === SYSTEM_GROUPS.ADMIN_FULL_ACCESS) {
      return res.status(400).json({
        success: false,
        message: 'Admin full access group cannot be default'
      });
    }

    await PermissionGroup.update({ is_default: false }, { where: {} });
    await group.update({ is_default: true });

    res.json({
      success: true,
      message: 'Default permission group updated successfully'
    });
  }

  async deleteGroup(req, res) {
    const groupId = parseInt(req.params.id, 10);
    const group = await PermissionGroup.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Permission group not found' });
    }

    if (group.is_system) {
      return res.status(400).json({
        success: false,
        message: 'System groups cannot be deleted'
      });
    }

    await group.destroy();

    res.json({
      success: true,
      message: 'Permission group deleted successfully'
    });
  }
}

module.exports = new PermissionController();
