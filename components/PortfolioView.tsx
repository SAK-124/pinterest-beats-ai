
import React, { useState } from 'react';
import { Project, TeamMember } from '../types';
import { summarizeDocument } from '../services/geminiService';
// Fix: Removed unused and non-existent icon imports.
import { UploadIcon, TrashIcon, DownloadIcon, CheckIcon, PencilIcon, XMarkIcon } from './icons';

interface AdminPanelProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ projects, setProjects, teamMembers, setTeamMembers }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const summary = await summarizeDocument(file.name);
      
      const newProject: Project = {
        id: new Date().toISOString(),
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        summary: summary,
      };

      setProjects(prevProjects => [newProject, ...prevProjects]);
    } catch (err) {
      setError('Failed to summarize the document. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => {
        if (p.id === id) {
            URL.revokeObjectURL(p.fileUrl);
        }
        return p.id !== id;
    }));
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember({...member});
  };

  const handleSaveMember = () => {
    if(!editingMember) return;
    if (isAddingNew) {
         setTeamMembers(prev => [...prev, editingMember]);
    } else {
        setTeamMembers(prev => prev.map(m => m.name === editingMember.name ? editingMember : m));
    }
    setEditingMember(null);
    setIsAddingNew(false);
  };

    const handleAddNewMember = () => {
        const newBlankMember: TeamMember = {
            name: `New Member ${teamMembers.length + 1}`,
            title: '',
            blurb: '',
            skills: [],
            imageUrl: 'https://picsum.photos/seed/new/200'
        };
        setEditingMember(newBlankMember);
        setIsAddingNew(true);
    };

    const handleDeleteMember = (name: string) => {
        setTeamMembers(prev => prev.filter(m => m.name !== name));
    }

  const MemberEditForm = () => {
    if (!editingMember) return null;
    return (
        <div className="bg-slate-700/50 p-4 rounded-lg mt-4 space-y-3">
             <h3 className="text-lg font-bold">{isAddingNew ? "Add New Team Member" : "Editing " + editingMember.name}</h3>
            <input type="text" placeholder="Name" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} className="w-full bg-slate-600 p-2 rounded" />
            <input type="text" placeholder="Title" value={editingMember.title} onChange={e => setEditingMember({...editingMember, title: e.target.value})} className="w-full bg-slate-600 p-2 rounded" />
            <textarea placeholder="Blurb" value={editingMember.blurb} onChange={e => setEditingMember({...editingMember, blurb: e.target.value})} className="w-full bg-slate-600 p-2 rounded h-24" />
            <input type="text" placeholder="Image URL" value={editingMember.imageUrl} onChange={e => setEditingMember({...editingMember, imageUrl: e.target.value})} className="w-full bg-slate-600 p-2 rounded" />
            <input type="text" placeholder="Skills (comma-separated)" value={editingMember.skills.join(', ')} onChange={e => setEditingMember({...editingMember, skills: e.target.value.split(',').map(s => s.trim())})} className="w-full bg-slate-600 p-2 rounded" />
            <div className="flex justify-end space-x-2">
                <button onClick={() => { setEditingMember(null); setIsAddingNew(false); }} className="px-3 py-1 bg-gray-500 rounded hover:bg-gray-600 flex items-center"><XMarkIcon className="w-4 h-4 mr-1"/>Cancel</button>
                <button onClick={handleSaveMember} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 flex items-center"><CheckIcon className="w-4 h-4 mr-1"/>Save</button>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Project Management */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Upload New Project</h2>
        <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOCX, XLSX, etc.</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
            </label>
        </div>
        {isUploading && <p className="text-center mt-4 text-blue-400 animate-pulse">Analyzing document and generating summary...</p>}
        {error && <p className="text-center mt-4 text-red-400">{error}</p>}
      </div>
      
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 shadow-lg">
         <h2 className="text-2xl font-bold mb-4">Manage Projects</h2>
         <div className="space-y-4">
            {projects.length === 0 ? <p className="text-gray-400">No projects uploaded yet.</p> : (
                projects.map(project => (
                    <div key={project.id} className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg">
                        <span className="font-medium truncate">{project.fileName}</span>
                        <div className="flex items-center space-x-3">
                             <a href={project.fileUrl} download={project.fileName} className="text-gray-300 hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-slate-600"><DownloadIcon className="w-5 h-5" /></a>
                            <button onClick={() => handleDeleteProject(project.id)} className="text-gray-300 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-slate-600"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))
            )}
         </div>
      </div>

      {/* Team Management */}
       <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 shadow-lg">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Manage Team</h2>
            <button onClick={handleAddNewMember} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 text-sm">Add New</button>
         </div>
         <div className="space-y-4">
            {editingMember && <MemberEditForm />}
            {teamMembers.length === 0 ? <p className="text-gray-400">No team members added yet.</p> : (
                teamMembers.map(member => (
                    <div key={member.name} className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <img src={member.imageUrl} alt={member.name} className="w-10 h-10 rounded-full mr-4"/>
                            <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-gray-400">{member.title}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={() => handleEditMember(member)} className="text-gray-300 hover:text-green-400 transition-colors p-2 rounded-full hover:bg-slate-600"><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteMember(member.name)} className="text-gray-300 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-slate-600"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))
            )}
         </div>
      </div>
    </div>
  );
};

export default AdminPanel;
