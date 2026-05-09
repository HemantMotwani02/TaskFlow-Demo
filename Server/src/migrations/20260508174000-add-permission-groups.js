'use strict';

const { PERMISSION_DEFINITIONS, SYSTEM_GROUPS } = require('../constants/permissions');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permission_definitions', {
      permission_definition_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('permission_groups', {
      permission_group_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('permission_group_items', {
      permission_group_item_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      permission_group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permission_groups',
          key: 'permission_group_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      permission_definition_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permission_definitions',
          key: 'permission_definition_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('permission_group_items', {
      fields: ['permission_group_id', 'permission_definition_id'],
      type: 'unique',
      name: 'uniq_permission_group_definition'
    });

    await queryInterface.addColumn('userinfos', 'permission_group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'permission_groups',
        key: 'permission_group_id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    const now = new Date();
    await queryInterface.bulkInsert('permission_definitions', PERMISSION_DEFINITIONS.map((def) => ({
      key: def.key,
      module: def.module,
      description: def.description,
      created_at: now,
      updated_at: now
    })));

    await queryInterface.bulkInsert('permission_groups', [
      {
        name: SYSTEM_GROUPS.ADMIN_FULL_ACCESS,
        is_default: false,
        is_system: true,
        created_by: null,
        created_at: now,
        updated_at: now
      },
      {
        name: SYSTEM_GROUPS.DEFAULT_USER,
        is_default: true,
        is_system: true,
        created_by: null,
        created_at: now,
        updated_at: now
      }
    ]);

    const [groups] = await queryInterface.sequelize.query(
      'SELECT permission_group_id, name FROM permission_groups WHERE name IN (:adminGroup, :defaultGroup)',
      {
        replacements: {
          adminGroup: SYSTEM_GROUPS.ADMIN_FULL_ACCESS,
          defaultGroup: SYSTEM_GROUPS.DEFAULT_USER
        }
      }
    );

    const [definitions] = await queryInterface.sequelize.query(
      'SELECT permission_definition_id, `key` FROM permission_definitions'
    );

    const groupMap = groups.reduce((acc, group) => {
      acc[group.name] = group.permission_group_id;
      return acc;
    }, {});

    const defaultPermissionKeys = [
      'dashboard.view',
      'projects.view',
      'team.view',
      'tasks.view',
      'logs.view',
      'timeline.view',
      'settings.view',
      'notifications.view'
    ];

    const adminGroupId = groupMap[SYSTEM_GROUPS.ADMIN_FULL_ACCESS];
    const defaultGroupId = groupMap[SYSTEM_GROUPS.DEFAULT_USER];

    const items = [];
    for (const def of definitions) {
      items.push({
        permission_group_id: adminGroupId,
        permission_definition_id: def.permission_definition_id,
        created_at: now,
        updated_at: now
      });

      if (defaultPermissionKeys.includes(def.key)) {
        items.push({
          permission_group_id: defaultGroupId,
          permission_definition_id: def.permission_definition_id,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (items.length > 0) {
      await queryInterface.bulkInsert('permission_group_items', items);
    }

    await queryInterface.sequelize.query(
      `UPDATE userinfos
       SET permission_group_id = CASE
         WHEN role = 'admin' THEN :adminGroupId
         ELSE :defaultGroupId
       END
       WHERE permission_group_id IS NULL`,
      {
        replacements: {
          adminGroupId,
          defaultGroupId
        }
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('userinfos', 'permission_group_id');
    await queryInterface.dropTable('permission_group_items');
    await queryInterface.dropTable('permission_groups');
    await queryInterface.dropTable('permission_definitions');
  }
};
