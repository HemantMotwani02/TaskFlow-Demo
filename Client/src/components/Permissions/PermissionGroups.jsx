import React, { useEffect, useMemo, useState } from 'react';
import { usePermissionStore } from '../../store';

const PermissionGroups = () => {
  const {
    groups,
    definitions,
    pagination,
    isLoading,
    error,
    fetchDefinitions,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    setDefaultGroup
  } = usePermissionStore();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  useEffect(() => {
    fetchGroups(currentPage, 10, search);
  }, [currentPage, search, fetchGroups]);

  const definitionsByModule = useMemo(() => {
    return definitions.reduce((acc, item) => {
      if (!acc[item.module]) acc[item.module] = [];
      acc[item.module].push(item);
      return acc;
    }, {});
  }, [definitions]);

  const handleEdit = (group) => {
    setEditingGroup(group);
    setName(group.name);
    setSelectedPermissions(group.permissions.map((p) => p.permission_definition_id));
    setSubmitError('');
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setName('');
    setSelectedPermissions([]);
    setSubmitError('');
    setFormOpen(true);
  };

  const togglePermission = (id) => {
    setSelectedPermissions((prev) => (
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!name.trim()) {
      setSubmitError('Group name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      permission_definition_ids: selectedPermissions
    };

    const result = editingGroup
      ? await updateGroup(editingGroup.permission_group_id, payload)
      : await createGroup(payload);

    if (!result.success) {
      setSubmitError(result.error || 'Unable to save permission group');
      return;
    }

    setFormOpen(false);
    fetchGroups(currentPage, 10, search);
  };

  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Permission Groups</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
            Configure page-level access groups for users and managers.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm self-start"
        >
          Create Group
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search by group name"
          className="w-full sm:w-72 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">Groups</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading permission groups...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groups.map((group) => (
              <div key={group.permission_group_id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                    {group.is_default && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Default</span>}
                    {group.is_system && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">System</span>}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {group.permissions.length} permissions assigned
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!group.is_system && (
                    <button onClick={() => handleEdit(group)} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Edit
                    </button>
                  )}
                  {!group.is_default && group.name !== 'ADMIN_FULL_ACCESS' && (
                    <button onClick={async () => { await setDefaultGroup(group.permission_group_id); fetchGroups(currentPage, 10, search); }} className="px-3 py-1.5 text-xs sm:text-sm border border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      Set Default
                    </button>
                  )}
                  {!group.is_system && (
                    <button onClick={async () => { await deleteGroup(group.permission_group_id); fetchGroups(currentPage, 10, search); }} className="px-3 py-1.5 text-xs sm:text-sm border border-red-300 text-red-700 dark:border-red-700 dark:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Page {pagination.page} of {Math.max(pagination.pages, 1)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.pages || 1, p + 1))}
              disabled={pagination.page >= (pagination.pages || 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingGroup ? 'Edit Permission Group' : 'Create Permission Group'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g. Manager Limited Access"
                  disabled={editingGroup?.is_system}
                />
              </div>

              <div>
                <p className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Permissions</p>
                <div className="space-y-4">
                  {Object.entries(definitionsByModule).map(([module, modulePermissions]) => (
                    <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 capitalize">{module}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {modulePermissions.map((perm) => (
                          <label key={perm.permission_definition_id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.permission_definition_id)}
                              onChange={() => togglePermission(perm.permission_definition_id)}
                              disabled={editingGroup?.name === 'ADMIN_FULL_ACCESS'}
                            />
                            {perm.description}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionGroups;
