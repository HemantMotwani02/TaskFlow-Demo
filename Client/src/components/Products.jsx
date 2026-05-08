import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../store";
import { useAuthStore, ROLES } from "../store";
import HandleCardData from "./HandleCardData";
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import EditProjectForm from "./NewProject/EditProjectForm";
import NewProjectForm from "./NewProject/NewProjectForm";
import ManageProjectTeam from "./ProjectDetails/ManageProjectTeam";

const Products = () => {
  const navigate = useNavigate();
  const { user, canAccess } = useAuthStore();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 projects per page (2 rows of 3)
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showManageTeam, setShowManageTeam] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter projects based on search term and status
  const filteredProjects = (projects || []).filter(project => {
    if (!project) return false;
    
    // Search filter
    const projectName = project.name || project.project_name || '';
    const matchesSearch = projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEditProject = (e, project) => {
    e.stopPropagation(); // Prevent navigation to project details
    setSelectedProject(project);
    setShowEditForm(true);
  };

  const handleNewProject = () => {
    setShowNewProjectForm(true);
  };

  const handleManageTeam = (project) => {
    setSelectedProjectForTeam(project);
    setShowManageTeam(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 m-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading projects</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and track your projects</p>
        </div>
        
        {canAccess([ROLES.ADMIN, ROLES.MANAGER]) && (
          <button
            onClick={handleNewProject}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            + New Project
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search projects by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          >
            <option value="all" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">All Status</option>
            <option value="active" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Active</option>
            <option value="in_progress" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">In Progress</option>
            <option value="completed" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Completed</option>
            <option value="on_hold" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">On Hold</option>
            <option value="cancelled" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {currentProjects && currentProjects.length > 0 ? (
          <>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProjects.map(project => {
                  // Try multiple possible ID fields based on the data structure
                  const projectId = project.id || project.project_id || project.manager_id || project.created_by;
                  
                  return (
                    <div 
                      key={projectId} 
                      className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer h-80 flex flex-col"
                      onClick={() => navigate(`/project/${projectId}`)}
                    >
                      <div className="p-6 flex-1 flex flex-col min-h-0">
                        {/* Project Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {project.name || project.project_name || 'Unnamed Project'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 h-10 overflow-hidden" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.25rem'
                            }}>
                              {project.description || project.project_details || 'No description available'}
                            </p>
                          </div>
                          {canAccess([ROLES.ADMIN, ROLES.MANAGER]) && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleManageTeam(project)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                title="Manage Team"
                              >
                                <UserGroupIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => handleEditProject(e, project)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                                title="Edit Project"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Project Details */}
                        <div className="space-y-3 flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              project.status === 'active' || project.status === 'in_progress'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : project.status === 'completed'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : project.status === 'on_hold'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : project.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {project.status || 'Unknown'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Manager:</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {project.manager?.name || 'Unassigned'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Progress:</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {project.progress || 0}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Tasks:</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {project.tasks?.length || 0}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Created:</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>

                        {/* View Project Button */}
                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-600">
                          <button className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200">
                            View Project
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProjects.length)} of {filteredProjects.length} projects
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (searchTerm || statusFilter !== "all") ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
              <MagnifyingGlassIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? `No projects match your search for "${searchTerm}".`
                : `No projects found with status "${statusFilter}".`
              }
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new project.
            </p>
            {canAccess([ROLES.ADMIN, ROLES.MANAGER]) && (
              <div className="mt-6">
                <button
                   onClick={handleNewProject}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + New Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>

             {/* Edit Project Form Modal */}
       {showEditForm && selectedProject && (
         <EditProjectForm
           project={selectedProject}
           onClose={() => {
             setShowEditForm(false);
             setSelectedProject(null);
           }}
           onProjectUpdated={(updatedProject) => {
             // Refresh the projects data
             fetchProjects();
             setShowEditForm(false);
             setSelectedProject(null);
           }}
         />
       )}

       {/* New Project Form Modal */}
       {showNewProjectForm && (
         <NewProjectForm
           onClose={() => {
             setShowNewProjectForm(false);
           }}
           onProjectCreated={(newProject) => {
             // Refresh the projects data
             fetchProjects();
             setShowNewProjectForm(false);
           }}
         />
       )}

       {/* Manage Project Team Modal */}
       {showManageTeam && selectedProjectForTeam && (
         <ManageProjectTeam
           project={selectedProjectForTeam}
           onClose={() => {
             setShowManageTeam(false);
             setSelectedProjectForTeam(null);
           }}
           onTeamUpdated={(updatedProject) => {
             fetchProjects(); // Refresh the projects data
             setShowManageTeam(false);
             setSelectedProjectForTeam(null);
           }}
         />
       )}
    </div>
  );
};

export default Products;