"use client";

import "@/lib/amplify";
import { fetchAuthSession, fetchUserAttributes, signOut, updatePassword } from "aws-amplify/auth";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  Trash2,
  Pencil,
  UserPlus,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";

import {
  getTasks,
  createTask as createTaskRequest,
  updateTask as updateTaskRequest,
  getProjects,
  createProject as createProjectRequest,
  updateProject as updateProjectRequest,
  deleteProject as deleteProjectRequest,
  getProjectMembers,
  addProjectMember as addProjectMemberRequest,
  removeProjectMember as removeProjectMemberRequest,
  getPeople,
  createPerson,
  deletePerson,
  getDepartments,
  createDepartment,
  deleteDepartment,
} from "@/lib/orgshield-api";

import type {
  OrgShieldTask,
  OrgShieldProject,
  OrgShieldProjectMember,
  OrgShieldPerson,
  OrgShieldDepartment,
} from "@/lib/orgshield-api";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My Tasks", icon: ListTodo },
  { label: "Projects", icon: FolderKanban },
  { label: "People", icon: Users },
  { label: "Departments", icon: Building2 },
  { label: "Activity", icon: Activity },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60";

function initials(name?: string) {
  if (!name) return "YO";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "YO";
}

function assigneeColor(name?: string) {
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
  ];
  const sum = (name ?? "").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

function displayDue(value?: string) {
  if (!value || value === "Not set") return "Not set";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return value;
}

function TaskTable({ tasks, loading, updatingTaskId, onToggle }: { tasks: OrgShieldTask[]; loading: boolean; updatingTaskId: string | null; onToggle: (task: OrgShieldTask) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th className="px-6 py-4">Task</th><th className="px-5 py-4">Assignee</th><th className="px-5 py-4">Priority</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Due date</th><th className="px-5 py-4">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{loading && <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><LoaderCircle size={17} className="animate-spin" />Loading tasks…</span></td></tr>}{!loading && tasks.map((task) => <tr key={task.id} className="transition hover:bg-slate-50/70"><td className="px-6 py-4"><div className="flex items-start gap-3"><button aria-label={`Mark ${task.title} ${task.status === "Done" ? "incomplete" : "complete"}`} disabled={updatingTaskId === task.id} onClick={() => onToggle(task)} className={`mt-0.5 rounded-full disabled:opacity-50 ${task.status === "Done" ? "text-emerald-500" : "text-slate-300 hover:text-violet-600"}`}><CheckCircle2 size={19} /></button><div><p className={`text-sm font-semibold ${task.status === "Done" ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.project || "General"}</p></div></div></td><td className="px-5 py-4"><div className="flex items-center gap-2.5"><div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${assigneeColor(task.person)}`}>{initials(task.person)}</div><span className="text-sm text-slate-600">{task.person || "You"}</span></div></td><td className="px-5 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${task.priority === "High" ? "bg-rose-50 text-rose-700" : task.priority === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{task.priority || "Medium"}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${task.status === "Done" ? "bg-emerald-50 text-emerald-700" : task.status === "In Progress" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{task.status}</span></td><td className="px-5 py-4 text-sm text-slate-500">{displayDue(task.due)}</td><td className="px-5 py-4"><button disabled={updatingTaskId === task.id} onClick={() => onToggle(task)} className="whitespace-nowrap text-xs font-semibold text-violet-600 hover:text-violet-800 disabled:opacity-50">{updatingTaskId === task.id ? "Saving…" : task.status === "Done" ? "Reopen" : "Mark done"}</button></td></tr>)}{!loading && tasks.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">No tasks yet. Create a task to get started.</td></tr>}</tbody></table><div className="flex items-center justify-between border-t border-slate-100 px-6 py-4"><p className="text-xs text-slate-500">{loading ? "Loading tasks…" : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`}</p><p className="text-xs text-slate-400">Task data · OrgShield API</p></div></div>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Account");
  const [userEmail, setUserEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("Organization workspace");
  const [loggingOut, setLoggingOut] = useState(false);
  const [tasks, setTasks] = useState<OrgShieldTask[]>([]);
  const [projects, setProjects] = useState<OrgShieldProject[]>([]);
  const [members, setMembers] = useState<OrgShieldProjectMember[]>([]);
  const [people, setPeople] = useState<OrgShieldPerson[]>([]);
  const [departmentRecords, setDepartmentRecords] = useState<OrgShieldDepartment[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [personForm, setPersonForm] = useState({ name: "", email: "", title: "", department: "" });
  const [departmentForm, setDepartmentForm] = useState({ name: "", description: "", head: "" });
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<OrgShieldProject | null>(null);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<OrgShieldProject | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    projectId: "",
    priority: "Medium" as OrgShieldTask["priority"],
    due: "",
    assignee: "",
  });
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    startDate: "",
    dueDate: "",
    status: "Planned" as OrgShieldProject["status"],
  });
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    role: "Member" as OrgShieldProjectMember["role"],
  });
  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirmNewPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword({ oldPassword: currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setNotice("Your password was changed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await getTasks());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      setProjects(await getProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects.");
    } finally {
      setProjectsLoading(false);
    }
  }, []);
  const loadPeopleAndDepartments = useCallback(async () => {
    setPeopleLoading(true);
    try {
      const [peopleResult, departmentResult] = await Promise.all([getPeople(), getDepartments()]);
      setPeople(peopleResult);
      setDepartmentRecords(departmentResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load people and departments.");
    } finally { setPeopleLoading(false); }
  }, []);
  const loadMembers = useCallback(async (projectId: string) => {
    try {
      setMembers(await getProjectMembers(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load project members.");
    }
  }, []);
  useEffect(() => {
    let active = true;
    async function loadSignedInUserAndOrganization() {
      try {
        const attributes = await fetchUserAttributes();
        const fullName = [attributes.given_name, attributes.family_name].filter(Boolean).join(" ").trim();
        const name = fullName || attributes.name || attributes.preferred_username ||
          (attributes.email ? attributes.email.split("@")[0] : "") || "Account";
        if (active) {
          setDisplayName(name);
          setUserEmail(attributes.email || "");
        }
        // The organization is shared data: fetch it from the authenticated API,
        // rather than relying on browser sessionStorage which invited members cannot share.
        const apiUrl = process.env.NEXT_PUBLIC_ORGSHIELD_API_URL;
        if (!apiUrl) return;
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) return;
        const response = await fetch(`${apiUrl.replace(/\/+$/, "")}/organizations`, {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });
        if (!response.ok) return;
        const data: unknown = await response.json();
        const organizations = Array.isArray(data) ? data : [];
        const firstOrganization = organizations.find(
          (item): item is { name: string } =>
            typeof item === "object" && item !== null &&
            "name" in item && typeof item.name === "string" && item.name.trim().length > 0
        );
        if (active && firstOrganization) {
          setOrganizationName(firstOrganization.name.trim());
        }
      } catch {
        // Keep safe fallbacks if profile or organization attributes are unavailable.
      }
    }
    void loadSignedInUserAndOrganization();
    return () => { active = false; };
  }, []);
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setProfileMenuOpen(false);
    try {
      await signOut();
    } catch {
      // Redirect even if local sign-out reports an error, so the user can sign in again.
    } finally {
      window.location.replace("/signin");
    }
  }
  useEffect(() => {
    void loadTasks();
    void loadProjects();
    void loadPeopleAndDepartments();
  }, [loadTasks, loadProjects, loadPeopleAndDepartments]);
  useEffect(() => {
    if (selectedProject) {
      void loadMembers(selectedProject.id);
    } else {
      setMembers([]);
    }
  }, [selectedProject, loadMembers]);
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        `${task.title} ${task.project} ${task.person} ${task.status} ${task.priority}`
          .toLowerCase()
          .includes(query);
      if (!matchesSearch) return false;
      if (activeNav === "Projects" && selectedProject) {
        return task.projectId === selectedProject.id;
      }
      return true;
    });
  }, [tasks, search, activeNav, selectedProject]);
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length;
  const todoTasks = tasks.filter((task) => task.status === "To Do").length;
  function openCreateTask(project?: OrgShieldProject) {
    setError("");
    setNotice("");
    setNewTask({
      title: "",
      projectId: project?.id ?? selectedProject?.id ?? "",
      priority: "Medium",
      due: "",
      assignee: "",
    });
    setShowNewTask(true);
  }
  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTask.title.trim()) return;
    const project = projects.find((item) => item.id === newTask.projectId);
    const member = members.find((item) => item.id === newTask.assignee);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const created = await createTaskRequest({
        title: newTask.title.trim(),
        project: project?.name ?? "General",
        projectId: project?.id ?? "",
        priority: newTask.priority,
        due: newTask.due || "Not set",
        status: "To Do",
        ...(member
          ? { assignee: member.email || member.id, person: member.name }
          : {}),
      });
      setTasks((current) => [created, ...current]);
      setShowNewTask(false);
      setNotice("Task created and saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }
  async function toggleTask(task: OrgShieldTask) {
    if (!task.id || updatingTaskId) return;
    const nextStatus = task.status === "Done" ? "To Do" : "Done";
    setUpdatingTaskId(task.id);
    setError("");
    setNotice("");
    try {
      const updated = await updateTaskRequest(task.id, { status: nextStatus });
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, ...updated } : item
        )
      );
      setNotice("Task status saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task.");
    } finally {
      setUpdatingTaskId(null);
    }
  }
  function openProjectForm(project?: OrgShieldProject) {
    setEditingProject(project ?? null);
    setProjectForm(
      project
        ? {
            name: project.name,
            description: project.description || "",
            startDate: project.startDate || "",
            dueDate: project.dueDate || "",
            status: project.status,
          }
        : {
            name: "",
            description: "",
            startDate: "",
            dueDate: "",
            status: "Planned",
          }
    );
    setShowProjectForm(true);
    setError("");
    setNotice("");
  }
  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectForm.name.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingProject) {
        const updated = await updateProjectRequest(editingProject.id, projectForm);
        setProjects((current) =>
          current.map((project) => project.id === updated.id ? updated : project)
        );
        if (selectedProject?.id === updated.id) {
          setSelectedProject(updated);
        }
        setNotice("Project updated and saved.");
      } else {
        const created = await createProjectRequest(projectForm);
        setProjects((current) => [created, ...current]);
        setSelectedProject(created);
        setActiveNav("Projects");
        setNotice("Project created and saved.");
      }
      setShowProjectForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }
  async function removeProject(project: OrgShieldProject) {
    if (
      !window.confirm(
        `Delete project "${project.name}" and its member records? Tasks will remain in your task list.`
      )
    ) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await deleteProjectRequest(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
      }
      setNotice("Project deleted. Existing tasks were retained.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete project.");
    }
  }
  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !memberForm.name.trim() || !memberForm.email.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const member = await addProjectMemberRequest(selectedProject.id, memberForm);
      setMembers((current) => [...current, member]);
      setMemberForm({ name: "", email: "", role: "Member" });
      setShowMemberForm(false);
      setNotice("Member added to project.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add member.");
    } finally {
      setSaving(false);
    }
  }
  async function removeMember(member: OrgShieldProjectMember) {
    if (
      !selectedProject ||
      !window.confirm(`Remove ${member.name} from this project?`)
    ) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await removeProjectMemberRequest(selectedProject.id, member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      setNotice("Project member removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove member.");
    }
  }
  async function savePerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const created = await createPerson({ ...personForm, name: personForm.name.trim(), email: personForm.email.trim().toLowerCase(), role: "Employee",});
      
      setPeople((current) => [...current, created]);
      setPersonForm({ name: "", email: "", title: "", department: "" });
      setShowPersonForm(false); setNotice("Person added to the organization directory.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to add person."); }
    finally { setSaving(false); }
  }
  async function removePerson(person: OrgShieldPerson) {
    if (!window.confirm(`Remove ${person.name} from the people directory?`)) return;
    try { await deletePerson(person.id); setPeople((current) => current.filter((item) => item.id !== person.id)); setNotice("Person removed from directory."); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to remove person."); }
  }
  async function saveDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const created = await createDepartment({ ...departmentForm, name: departmentForm.name.trim() });
      setDepartmentRecords((current) => [...current, created]);
      setDepartmentForm({ name: "", description: "", head: "" }); setShowDepartmentForm(false); setNotice("Department created.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create department."); }
    finally { setSaving(false); }
  }
  async function removeDepartment(department: OrgShieldDepartment) {
    if (!window.confirm(`Delete department ${department.name}?`)) return;
    try { await deleteDepartment(department.id); setDepartmentRecords((current) => current.filter((item) => item.id !== department.id)); setNotice("Department deleted."); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to delete department."); }
  }

  const metrics = [
    {
      title: "Total tasks",
      value: tasks.length,
      change: "Saved tasks",
      icon: ListTodo,
      iconColor: "bg-violet-50 text-violet-600",
      positive: true,
    },
    {
      title: "Completed",
      value: completedTasks,
      change: "Marked as done",
      icon: CheckCircle2,
      iconColor: "bg-emerald-50 text-emerald-600",
      positive: true,
    },
    {
      title: "In progress",
      value: inProgressTasks,
      change: "Currently active",
      icon: Activity,
      iconColor: "bg-sky-50 text-sky-600",
      positive: true,
    },
    {
      title: "To do",
      value: todoTasks,
      change: "Awaiting action",
      icon: Clock3,
      iconColor: "bg-amber-50 text-amber-600",
      positive: false,
    },
  ];
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {mobileMenu && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <ShieldCheck size={23} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">OrgShield</h1>
            <p className="text-xs text-slate-500">Organization workspace</p>
          </div>
          <button
            className="ml-auto rounded-lg p-1 text-slate-500 lg:hidden"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>
        <div className="px-4 pt-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
              <Building2 size={19} />
            </div>
            <div>
              <p className="max-w-[150px] truncate text-sm font-semibold" title={organizationName}>{organizationName}</p>
              <p className="text-xs text-slate-500">Workspace</p>
            </div>
            <ChevronDown size={16} className="ml-auto text-slate-400" />
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Menu
          </p>
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label);
                setMobileMenu(false);
                if (label !== "Projects") setSelectedProject(null);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                activeNav === label
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "My Tasks" && (
                <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {tasks.length}
                </span>
              )}
              {label === "Projects" && (
                <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {projects.length}
                </span>
              )}
            </button>
          ))}
          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Administration
          </p>
          <button
            onClick={() => setActiveNav("Settings")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
              activeNav === "Settings"
                ? "bg-violet-50 text-violet-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Settings size={19} />
            Settings
          </button>
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              {initials(displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-slate-500">{userEmail || "Signed-in account"}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileMenu(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-xs text-slate-500">
                Workspace / {activeNav}
                {selectedProject ? ` / ${selectedProject.name}` : ""}
              </p>
              <h2 className="mt-0.5 text-lg font-bold">
                {selectedProject && activeNav === "Projects"
                  ? selectedProject.name
                  : activeNav}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex">
              <Search size={17} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white" />
            </button>
            <div className="relative">
            <button type="button" aria-label="Open profile menu" aria-haspopup="menu"
              aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 ring-offset-2 transition hover:bg-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
              {initials(displayName)}
            </button>
            {profileMenuOpen && <>
              <button type="button" aria-label="Close profile menu" className="fixed inset-0 z-40 cursor-default"
                onClick={() => setProfileMenuOpen(false)} />
              <div role="menu" className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{userEmail}</p>
                </div>
                <button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); setActiveNav("Settings"); }}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                  <Settings size={17} /> Profile &amp; settings
                </button>
                <button type="button" role="menuitem" disabled={loggingOut} onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                  <LogOut size={17} /> {loggingOut ? "Signing out..." : "Logout"}
                </button>
              </div>
            </>}
          </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1600px] space-y-7 p-4 sm:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-violet-600">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {activeNav === "Projects" && selectedProject
                  ? selectedProject.name
                  : activeNav === "Projects"
                    ? "Your projects"
                    : `Welcome back, ${displayName} 👋`}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {activeNav === "Projects"
                  ? "Organize projects, manage members, and track their tasks."
                  : "Here's what's happening across your organization."}
              </p>
            </div>
            {activeNav === "Projects" ? (
              <div className="flex flex-wrap gap-2">
                {selectedProject && (
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setMembers([]);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft size={17} />
                    All projects
                  </button>
                )}
                <button
                  onClick={() => openProjectForm()}
                  className={buttonClass}
                >
                  <Plus size={18} />
                  New project
                </button>
                {selectedProject && (
                  <button
                    onClick={() => openCreateTask(selectedProject)}
                    className={buttonClass}
                  >
                    <Plus size={18} />
                    Add task
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => openCreateTask()}
                className={buttonClass}
              >
                <Plus size={18} />
                Create task
              </button>
            )}
          </section>
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="flex-1">{error}</div>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && !error && (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice}
            </div>
          )}
          {activeNav === "Projects" ? (
            selectedProject ? (
              <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Project status</p>
                    <p className="mt-2 text-lg font-bold">{selectedProject.status}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Team members</p>
                    <p className="mt-2 text-2xl font-bold">{members.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Project tasks</p>
                    <p className="mt-2 text-2xl font-bold">
                      {tasks.filter((task) => task.projectId === selectedProject.id).length}
                    </p>
                  </div>
                </section>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="text-lg font-bold">{selectedProject.name}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                        {selectedProject.description || "No description added."}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        <CalendarDays size={14} className="mr-1 inline" />
                        {selectedProject.startDate || "No start date"} — {selectedProject.dueDate || "No due date"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openProjectForm(selectedProject)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                        <Pencil size={15} /> Edit
                      </button>
                      <button onClick={() => void removeProject(selectedProject)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold">Project members</h3>
                      <p className="mt-1 text-sm text-slate-500">Manage the people assigned to this project.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setNotice("");
                        setMemberForm({ name: "", email: "", role: "Member" });
                        setShowMemberForm(true);
                      }}
                      className={buttonClass}
                    >
                      <UserPlus size={17} />
                      Add person
                    </button>
                  </div>
                  {members.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No members yet. Add a person to this project.
                    </p>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 py-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${assigneeColor(member.name)}`}>
                            {initials(member.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.email || "No email provided"} · {member.role}</p>
                          </div>
                          <button onClick={() => void removeMember(member)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${member.name}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
                    <div>
                      <h3 className="text-base font-bold">Project tasks</h3>
                      <p className="mt-1 text-sm text-slate-500">Tasks associated with this project.</p>
                    </div>
                    <button onClick={() => openCreateTask(selectedProject)} className={buttonClass}>
                      <Plus size={17} /> Add task
                    </button>
                  </div>
                  <TaskTable
                    tasks={filteredTasks.filter((task) => task.projectId === selectedProject.id)}
                    loading={loading}
                    updatingTaskId={updatingTaskId}
                    onToggle={(task) => void toggleTask(task)}
                  />
                </section>
              </div>
            ) : (
              <section>
                {projectsLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    <LoaderCircle size={22} className="mx-auto mb-3 animate-spin" />
                    Loading projects from AWS…
                  </div>
                ) : projects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <FolderKanban size={38} className="mx-auto text-violet-500" />
                    <h3 className="mt-4 text-lg font-bold">No projects yet</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                      Create your first project, add team members, and start assigning tasks.
                    </p>
                    <button onClick={() => openProjectForm()} className={`${buttonClass} mt-5`}>
                      <Plus size={17} /> Create your first project
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => {
                      const projectTasks = tasks.filter((task) => task.projectId === project.id);
                      return (
                        <button
                          key={project.id}
                          onClick={() => setSelectedProject(project)}
                          className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                              <FolderKanban size={22} />
                            </div>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{project.status}</span>
                          </div>
                          <h3 className="mt-4 text-base font-bold">{project.name}</h3>
                          <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">{project.description || "No description added."}</p>
                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                            <span><ListTodo size={14} className="mr-1 inline" />{projectTasks.length} tasks</span>
                            <span>{project.dueDate ? `Due ${displayDue(project.dueDate)}` : "No deadline"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )
          ) : activeNav === "Overview" || activeNav === "My Tasks" ? (
            <>
              {activeNav === "Overview" && (
                <>
                  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => (
                      <div key={metric.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                            <p className="mt-3 text-3xl font-bold tracking-tight">{loading ? "—" : metric.value}</p>
                          </div>
                          <div className={`rounded-xl p-3 ${metric.iconColor}`}><metric.icon size={21} /></div>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                          {metric.positive ? <ArrowUpRight size={15} className="text-emerald-600" /> : <ArrowDownRight size={15} className="text-amber-600" />}
                          {metric.change}
                        </div>
                      </div>
                    ))}
                  </section>
                  <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold">Department performance</h3>
                          <p className="mt-1 text-sm text-slate-500">Based on departments and tasks currently saved in OrgShield</p>
                        </div>
                        <button onClick={() => setActiveNav("Departments")} className="text-sm font-semibold text-violet-600 hover:text-violet-800">View all</button>
                      </div>
                      {departmentRecords.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                          <Building2 size={25} className="mx-auto text-violet-500" />
                          <p className="mt-2 text-sm font-semibold text-slate-700">No departments created yet</p>
                          <p className="mt-1 text-xs text-slate-500">Create a department to see it here.</p>
                          <button onClick={() => { setActiveNav("Departments"); setShowDepartmentForm(true); }} className="mt-3 text-sm font-semibold text-violet-600">Add department</button>
                        </div>
                      ) : (
                        <div className="mt-7 space-y-6">
                          {departmentRecords.map((department) => {
                            const departmentPeople = people.filter((person) => person.department === department.name);
                            const personNames = new Set(departmentPeople.map((person) => person.name));
                            const departmentTasks = tasks.filter((task) => personNames.has(task.person));
                            const completed = departmentTasks.filter((task) => task.status === "Done").length;
                            const total = departmentTasks.length;
                            const percentage = total ? Math.round((completed / total) * 100) : 0;
                            return (
                              <button type="button" key={department.id} onClick={() => { setActiveNav("Departments"); setSelectedDepartmentId(department.id); }} className="block w-full rounded-xl p-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${assigneeColor(department.name)}`}>{initials(department.name)}</div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{department.name}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">{total ? `${completed} of ${total} tasks completed` : `${departmentPeople.length} people · no tasks assigned yet`}</p>
                                  </div>
                                  <p className="text-sm font-bold">{total ? `${percentage}%` : "—"}</p>
                                </div>
                                <div className="ml-[52px] mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${percentage}%` }} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between">
                        <div><h3 className="text-base font-bold">Organization snapshot</h3><p className="mt-1 text-sm text-slate-500">Live counts from your workspace</p></div>
                        <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600"><Building2 size={20} /></div>
                      </div>
                      <div className="mt-6 space-y-3">
                        {[
                          { label: "Departments", value: String(departmentRecords.length), description: "Loaded from OrgShield API" },
                          { label: "Team members", value: String(people.length), description: "People directory" },
                          { label: "Active projects", value: String(projects.filter((project) => project.status === "In Progress").length), description: "Projects marked in progress" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                            <div><p className="text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.description}</p></div>
                            <p className="text-2xl font-bold">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 rounded-xl bg-violet-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-violet-800"><Activity size={17} />Workspace health</div>
                        <p className="mt-2 text-xs leading-5 text-violet-700">
                          {loading ? "Loading tasks from AWS…" : error ? "API needs attention. See the error above." : "Tasks and projects are connected to the OrgShield API. Counts reflect currently loaded data."}
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <h3 className="text-base font-bold">{activeNav === "My Tasks" ? "My tasks" : "Recent tasks"}</h3>
                    <p className="mt-1 text-sm text-slate-500">Tasks loaded from your authenticated OrgShield API</p>
                  </div>
                  <button onClick={() => void loadTasks()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>
                <TaskTable tasks={filteredTasks} loading={loading} updatingTaskId={updatingTaskId} onToggle={(task) => void toggleTask(task)} />
              </section>
            </>
          ) : activeNav === "People" ? (
            <section className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><h2 className="text-xl font-bold">People directory</h2><p className="mt-1 text-sm text-slate-500">Add each person once, then reuse them across projects.</p></div>
                <button onClick={() => { setPersonForm({ name: "", email: "", title: "", department: "" }); setShowPersonForm(true); }} className={buttonClass}><UserPlus size={17}/> Add person</button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {peopleLoading ? <p className="p-10 text-center text-sm text-slate-500">Loading people…</p> : people.length === 0 ? <div className="p-10 text-center"><Users size={32} className="mx-auto text-violet-500"/><h3 className="mt-3 font-bold">No people added yet</h3><p className="mt-1 text-sm text-slate-500">Add a person here first. You can select them when creating a project team.</p></div> : <div className="divide-y divide-slate-100">{people.map((person) => <div key={person.id} className="flex items-center gap-3 p-4 sm:px-6"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${assigneeColor(person.name)}`}>{initials(person.name)}</div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{person.name}</p><p className="text-sm text-slate-500">{person.email}{person.title ? ` · ${person.title}` : ""}</p><p className="text-xs text-slate-400">{person.department || "No department"}</p></div><button onClick={() => void removePerson(person)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${person.name}`}><Trash2 size={16}/></button></div>)}</div>}
              </div>
            </section>
          ) : activeNav === "Departments" ? (
            <section className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Departments</h2><p className="mt-1 text-sm text-slate-500">Create departments and assign existing people from the directory.</p></div><button onClick={() => { setDepartmentForm({ name: "", description: "", head: "" }); setShowDepartmentForm(true); }} className={buttonClass}><Plus size={17}/> Add department</button></div>
              {departmentRecords.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Building2 size={32} className="mx-auto text-violet-500"/><h3 className="mt-3 font-bold">No departments yet</h3><p className="mt-1 text-sm text-slate-500">Create your first department. Department data is saved through the OrgShield API.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{departmentRecords.map((department) => <div key={department.id} className={`rounded-2xl border bg-white p-5 transition hover:border-violet-300 hover:shadow-md ${selectedDepartmentId === department.id ? "border-violet-400 ring-2 ring-violet-100" : "border-slate-200"}`}><div className="flex items-start justify-between"><button type="button" onClick={() => setSelectedDepartmentId(department.id)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600" aria-label={`Open ${department.name} details`}><Building2 size={21}/></button><button type="button" onClick={() => void removeDepartment(department)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${department.name}`}><Trash2 size={16}/></button></div><button type="button" onClick={() => setSelectedDepartmentId(department.id)} className="mt-4 block w-full text-left"><h3 className="font-bold">{department.name}</h3><p className="mt-1 text-sm text-slate-500">{department.description || "No description added."}</p><p className="mt-3 text-xs text-slate-500">{people.filter((person) => person.department === department.name).length} people</p>{department.head && <p className="mt-1 text-xs text-slate-500">Department head: {department.head}</p>}<p className="mt-4 text-xs font-semibold text-violet-600">View department details →</p></button></div>)}</div>}
              {selectedDepartmentId && (() => { const department = departmentRecords.find((item) => item.id === selectedDepartmentId); if (!department) return null; const departmentPeople = people.filter((person) => person.department === department.name); const departmentTasks = tasks.filter((task) => departmentPeople.some((person) => person.name === task.person)); return <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-violet-600"><Building2 size={21}/><span className="text-sm font-medium">Department details</span></div><h3 className="mt-2 text-xl font-bold text-slate-900">{department.name}</h3><p className="mt-2 text-sm text-slate-500">{department.description || "No description added."}</p>{department.head && <p className="mt-2 text-sm text-slate-600">Department head: {department.head}</p>}</div><button type="button" onClick={() => setSelectedDepartmentId(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">Close</button></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Team members</p><p className="mt-1 text-2xl font-bold">{departmentPeople.length}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Total tasks</p><p className="mt-1 text-2xl font-bold">{departmentTasks.length}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Completed tasks</p><p className="mt-1 text-2xl font-bold">{departmentTasks.filter((task) => task.status === "Done").length}</p></div></div><div className="mt-6 border-t border-slate-100 pt-5"><h4 className="font-semibold text-slate-900">People in this department ({departmentPeople.length})</h4>{departmentPeople.length === 0 ? <p className="mt-3 text-sm text-slate-500">No people are assigned here yet. Edit a person in the People directory to assign this department.</p> : <div className="mt-3 divide-y divide-slate-100">{departmentPeople.map((person) => <div key={person.id} className="flex items-center gap-3 py-3"><div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${assigneeColor(person.name)}`}>{initials(person.name)}</div><div><p className="font-medium text-slate-800">{person.name}</p><p className="text-sm text-slate-500">{person.email}</p>{person.title && <p className="text-xs text-slate-400">{person.title}</p>}</div></div>)}</div>}</div><div className="mt-6 border-t border-slate-100 pt-5"><h4 className="font-semibold text-slate-900">Tasks ({departmentTasks.length})</h4>{departmentTasks.length === 0 ? <p className="mt-3 text-sm text-slate-500">No tasks are assigned to people in this department yet.</p> : <div className="mt-3 divide-y divide-slate-100">{departmentTasks.map((task) => <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium text-slate-800">{task.title}</p><p className="text-xs text-slate-500">{task.person} · {task.project || "General"}</p></div><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{task.status}</span></div>)}</div>}</div></section>; })()}
            </section>
          ) : activeNav === "Settings" ? (
            <section className="max-w-3xl space-y-5">
              <div>
                <h2 className="text-xl font-bold">Settings</h2>
                <p className="mt-1 text-sm text-slate-500">Manage your account security and password.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><ShieldCheck size={21}/></div>
                  <div><h3 className="font-bold text-slate-900">Change password</h3><p className="mt-1 text-sm text-slate-500">Enter your current password and choose a new one. Your password is securely updated by Amazon Cognito.</p></div>
                </div>
                <form onSubmit={changePassword} className="mt-6 max-w-xl space-y-4">
                  <label className="block text-sm font-medium text-slate-700">Current password<input required type="password" autoComplete="current-password" className={`${inputClass} mt-1.5`} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}/></label>
                  <label className="block text-sm font-medium text-slate-700">New password<input required minLength={8} type="password" autoComplete="new-password" className={`${inputClass} mt-1.5`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
                  <label className="block text-sm font-medium text-slate-700">Confirm new password<input required minLength={8} type="password" autoComplete="new-password" className={`${inputClass} mt-1.5`} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} /></label>
                  {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
                  {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
                  <button type="submit" disabled={passwordSaving} className={buttonClass}>{passwordSaving ? <><LoaderCircle size={16} className="animate-spin"/> Updating password…</> : <><ShieldCheck size={16}/> Change password</>}</button>
                </form>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><Activity size={32} className="mx-auto text-violet-600"/><h3 className="mt-3 text-lg font-bold">{activeNav}</h3><p className="mt-2 text-sm text-slate-500">Activity tracking will be connected to the audit log API next.</p></section>
          )}
          <footer className="flex flex-col items-center justify-between gap-3 pb-2 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} OrgShield. Organization management, simplified.</p>
            <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><CircleHelp size={14} />Help center</span><span className="flex items-center gap-1.5"><ShieldCheck size={14} />Secure workspace</span></div>
          </footer>
        </div>
      </main>
      {showPersonForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div className="my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Add a person</h3><button onClick={() => setShowPersonForm(false)} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X size={19}/></button></div>
            <p className="mt-1 text-sm text-slate-500">Create a directory entry once. This does not create a Cognito login or send an invitation.</p>
            <form onSubmit={savePerson} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Full name<input autoFocus required maxLength={200} className={`${inputClass} mt-1.5`} value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} placeholder="e.g. Aanya Sharma"/></label>
              <label className="block text-sm font-medium">Email address<input type="email" required maxLength={320} className={`${inputClass} mt-1.5`} value={personForm.email} onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })} placeholder="aanya@example.com"/></label>
              <label className="block text-sm font-medium">Job title<input maxLength={200} className={`${inputClass} mt-1.5`} value={personForm.title} onChange={(e) => setPersonForm({ ...personForm, title: e.target.value })} placeholder="e.g. Software Engineer"/></label>
              <label className="block text-sm font-medium">Department<select className={`${inputClass} mt-1.5`} value={personForm.department} onChange={(e) => setPersonForm({ ...personForm, department: e.target.value })}><option value="">No department</option>{departmentRecords.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}</select></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" disabled={saving} onClick={() => setShowPersonForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving || !personForm.name.trim() || !personForm.email.trim()} className={buttonClass}>{saving && <LoaderCircle size={16} className="animate-spin"/>}{saving ? "Saving…" : "Add person"}</button></div>
            </form>
          </div>
        </div>
      )}
      {showDepartmentForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div className="my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Create department</h3><button onClick={() => setShowDepartmentForm(false)} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X size={19}/></button></div>
            <form onSubmit={saveDepartment} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Department name<input autoFocus required maxLength={120} className={`${inputClass} mt-1.5`} value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} placeholder="e.g. Engineering"/></label>
              <label className="block text-sm font-medium">Description<textarea rows={3} maxLength={500} className={`${inputClass} mt-1.5`} value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} placeholder="What does this department do?"/></label>
              <label className="block text-sm font-medium">Department head (optional)<select className={`${inputClass} mt-1.5`} value={departmentForm.head} onChange={(e) => setDepartmentForm({ ...departmentForm, head: e.target.value })}><option value="">Not assigned</option>{people.map((person) => <option key={person.id} value={person.name}>{person.name}</option>)}</select></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" disabled={saving} onClick={() => setShowDepartmentForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving || !departmentForm.name.trim()} className={buttonClass}>{saving && <LoaderCircle size={16} className="animate-spin"/>}{saving ? "Saving…" : "Create department"}</button></div>
            </form>
          </div>
        </div>
      )}
      {showMemberForm && selectedProject && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div className="my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add project member</h3>
              <button
                type="button"
                onClick={() => setShowMemberForm(false)}
                disabled={saving}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Add a person to {selectedProject.name}.
            </p>
            <form onSubmit={addMember} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Choose a person from your directory
                <select autoFocus required className={`${inputClass} mt-1.5`} value={memberForm.email} onChange={(event) => { const person = people.find((item) => item.email === event.target.value); setMemberForm({ ...memberForm, email: person?.email || "", name: person?.name || "" }); }}>
                  <option value="">Select a person</option>
                  {people.filter((person) => !members.some((member) => member.email.toLowerCase() === person.email.toLowerCase())).map((person) => <option key={person.id} value={person.email}>{person.name} — {person.email}</option>)}
                </select>
              </label>
              {people.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Add people in the People section before assigning them to projects.</p>}
              <label className="block text-sm font-medium">Project role
                <select className={`${inputClass} mt-1.5`} value={memberForm.role} onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value as OrgShieldProjectMember["role"] })}>
                  <option value="Member">Member</option><option value="Admin">Admin</option><option value="Viewer">Viewer</option><option value="Owner">Owner</option>
                </select>
              </label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" disabled={saving} onClick={() => setShowMemberForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving || !memberForm.email || people.length === 0} className={buttonClass}>{saving && <LoaderCircle size={16} className="animate-spin"/>} Add to project</button></div>
            </form>
          </div>
        </div>
      )}
      {showProjectForm && <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"><div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-lg font-bold">{editingProject ? "Edit project" : "Create a project"}</h3><button onClick={() => setShowProjectForm(false)} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div><p className="mt-1 text-sm text-slate-500">Project details will be saved to DynamoDB.</p><form onSubmit={saveProject} className="mt-5 space-y-4"><label className="block text-sm font-medium">Project name<input autoFocus required maxLength={200} className={`${inputClass} mt-1.5`} value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="e.g. Website redesign" /></label><label className="block text-sm font-medium">Description<textarea maxLength={2000} rows={3} className={`${inputClass} mt-1.5`} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="What is this project about?" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium">Start date<input type="date" className={`${inputClass} mt-1.5`} value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} /></label><label className="block text-sm font-medium">Due date<input type="date" className={`${inputClass} mt-1.5`} value={projectForm.dueDate} onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })} /></label></div><label className="block text-sm font-medium">Status<select className={`${inputClass} mt-1.5`} value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as OrgShieldProject["status"] })}><option>Planned</option><option>In Progress</option><option>Completed</option><option>On Hold</option></select></label><div className="flex justify-end gap-3 pt-2"><button type="button" disabled={saving} onClick={() => setShowProjectForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving || !projectForm.name.trim()} className={buttonClass}>{saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? "Saving…" : editingProject ? "Save changes" : "Create project"}</button></div></form></div></div>}
      {showNewTask && <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"><div className="my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-lg font-bold">Create a task</h3><button onClick={() => setShowNewTask(false)} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div><p className="mt-1 text-sm text-slate-500">Tasks can be linked to a project and assigned to one of its members.</p><form onSubmit={addTask} className="mt-5 space-y-4"><label className="block text-sm font-medium">Task title<input autoFocus required maxLength={200} className={`${inputClass} mt-1.5`} value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g. Prepare sprint review" /></label><label className="block text-sm font-medium">Project<select className={`${inputClass} mt-1.5`} value={newTask.projectId} onChange={(e) => { setNewTask({ ...newTask, projectId: e.target.value, assignee: "" }); const p = projects.find((item) => item.id === e.target.value); if (p) void loadMembers(p.id); else setMembers([]); }}><option value="">General (no project)</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>{newTask.projectId && <label className="block text-sm font-medium">Assign to project member<select className={`${inputClass} mt-1.5`} value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}><option value="">Assign to me / unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}{member.email ? ` (${member.email})` : ""}</option>)}</select><span className="mt-1 block text-xs text-slate-500">If the list is empty, add members from the project's page first.</span></label>}<div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Priority<select className={`${inputClass} mt-1.5`} value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as OrgShieldTask["priority"] })}><option>Low</option><option>Medium</option><option>High</option></select></label><label className="block text-sm font-medium">Due date<input type="date" className={`${inputClass} mt-1.5`} value={newTask.due} onChange={(e) => setNewTask({ ...newTask, due: e.target.value })} /></label></div><div className="flex justify-end gap-3 pt-2"><button type="button" disabled={saving} onClick={() => setShowNewTask(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving || !newTask.title.trim()} className={buttonClass}>{saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? "Saving…" : "Create task"}</button></div></form></div></div>}
    </div>
  );
}