import { fetchAuthSession } from "aws-amplify/auth";

const API_URL = process.env.NEXT_PUBLIC_ORGSHIELD_API_URL;

export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "To Do" | "In Progress" | "Done";

export type OrgShieldTask = {
  id: string;
  title?: string;
  project: string;
  projectId?: string;
  assignee?: string;
  person: string;
  priority: TaskPriority;
  status: TaskStatus;
  due: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrgShieldProject = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  status: "Planned" | "In Progress" | "Completed" | "On Hold";
  createdAt?: string;
  updatedAt?: string;
};

export type OrgShieldProjectMember = {
  id: string;
  name: string;
  email: string;
  role: "Member" | "Admin" | "Viewer" | "Owner";
  createdAt?: string;
};

export type OrgShieldPerson = {
  id: string;
  name: string;
  email: string;
  title?: string;
  role: string;
  department?: string;
  status?: "Active" | "Pending" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
};

export type OrgShieldDepartment = {
  id: string;
  name: string;
  description?: string;
  head?: string;
  memberIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "API URL is missing. Set NEXT_PUBLIC_ORGSHIELD_API_URL in .env.local."
    );
  }

  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const response = await fetch(
    `${API_URL.replace(/\/$/, "")}${path}`,
    {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Access denied. Please sign in again or check API authorization."
      );
    }

    throw new Error(
      typeof data.error === "string"
        ? data.error
        : `API request failed (${response.status}).`
    );
  }

  return data as T;
}

// -------------------- TASKS --------------------

export async function getTasks(): Promise<OrgShieldTask[]> {
  const result = await apiRequest<{ tasks: OrgShieldTask[] }>("/tasks");
  return result.tasks;
}

export async function createTask(
  task: Pick<OrgShieldTask, "title"> &
    Partial<
      Omit<OrgShieldTask, "id" | "title" | "createdAt" | "updatedAt">
    >
): Promise<OrgShieldTask> {
  const result = await apiRequest<{ task: OrgShieldTask }>("/tasks", {
    method: "POST",
    body: task,
  });

  return result.task;
}

export async function updateTask(
  id: string,
  updates: Partial<
    Pick<
      OrgShieldTask,
      | "title"
      | "project"
      | "projectId"
      | "assignee"
      | "person"
      | "priority"
      | "status"
      | "due"
    >
  >
): Promise<OrgShieldTask> {
  const result = await apiRequest<{ task: OrgShieldTask }>(
    `/tasks/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: updates,
    }
  );

  return result.task;
}

export async function deleteTask(id: string): Promise<void> {
  await apiRequest<{ status: string; id: string }>(
    `/tasks/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

// -------------------- PROJECTS --------------------

export async function getProjects(): Promise<OrgShieldProject[]> {
  const result = await apiRequest<{ projects: OrgShieldProject[] }>(
    "/projects"
  );

  return result.projects;
}

export async function createProject(
  project: Omit<OrgShieldProject, "id" | "createdAt" | "updatedAt">
): Promise<OrgShieldProject> {
  const result = await apiRequest<{ project: OrgShieldProject }>(
    "/projects",
    {
      method: "POST",
      body: project,
    }
  );

  return result.project;
}

export async function updateProject(
  id: string,
  updates: Partial<
    Omit<OrgShieldProject, "id" | "createdAt" | "updatedAt">
  >
): Promise<OrgShieldProject> {
  const result = await apiRequest<{ project: OrgShieldProject }>(
    `/projects/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: updates,
    }
  );

  return result.project;
}

export async function deleteProject(id: string): Promise<void> {
  await apiRequest<{ status: string; id: string }>(
    `/projects/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

// -------------------- PROJECT MEMBERS --------------------

export async function getProjectMembers(
  projectId: string
): Promise<OrgShieldProjectMember[]> {
  const result = await apiRequest<{ members: OrgShieldProjectMember[] }>(
    `/projects/${encodeURIComponent(projectId)}/members`
  );

  return result.members;
}

export async function addProjectMember(
  projectId: string,
  member: Omit<OrgShieldProjectMember, "id" | "createdAt">
): Promise<OrgShieldProjectMember> {
  const result = await apiRequest<{ member: OrgShieldProjectMember }>(
    `/projects/${encodeURIComponent(projectId)}/members`,
    {
      method: "POST",
      body: member,
    }
  );

  return result.member;
}

export async function removeProjectMember(
  projectId: string,
  memberId: string
): Promise<void> {
  await apiRequest<{ status: string; id: string }>(
    `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`,
    { method: "DELETE" }
  );
}

// -------------------- PEOPLE --------------------

// -------------------- PEOPLE --------------------

export async function getPeople(): Promise<OrgShieldPerson[]> {
  const result = await apiRequest<{
    employees?: OrgShieldPerson[];
    people?: OrgShieldPerson[];
  }>("/employees");

  return result.employees ?? result.people ?? [];
}


export async function createPerson(
  person: Omit<OrgShieldPerson, "id" | "createdAt" | "updatedAt">
): Promise<OrgShieldPerson> {
  const payload = {
    name: person.name.trim(),
    email: person.email.trim().toLowerCase(),
    title: person.title?.trim() ?? "",
    department: person.department?.trim() ?? "",
  };

  const result = await apiRequest<{
    employee?: OrgShieldPerson;
    person?: OrgShieldPerson;
  }>("/employees", {
    method: "POST",
    body: payload,
  });

  const createdPerson = result.employee ?? result.person;

  if (!createdPerson) {
    throw new Error("The API did not return the created person.");
  }

  return {
    ...createdPerson,
    role: person.role,
    status: person.status ?? "Active",
  };
}

export async function deletePerson(id: string): Promise<void> {
  await apiRequest<{ status: string; id: string }>(
    `/employees/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
// -------------------- DEPARTMENTS --------------------

export async function getDepartments(): Promise<OrgShieldDepartment[]> {
  const result = await apiRequest<
    { departments?: OrgShieldDepartment[] } | OrgShieldDepartment[]
  >("/departments");

  if (Array.isArray(result)) {
    return result;
  }

  return result.departments ?? [];
}

export async function createDepartment(
  department: Omit<
    OrgShieldDepartment,
    "id" | "createdAt" | "updatedAt"
  >
): Promise<OrgShieldDepartment> {
  const result = await apiRequest<
    { department?: OrgShieldDepartment } | OrgShieldDepartment
  >("/departments", {
    method: "POST",
    body: department,
  });

  if ("department" in result && result.department) {
    return result.department;
  }

  return result as OrgShieldDepartment;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiRequest<{ status: string; id: string }>(
    `/departments/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}