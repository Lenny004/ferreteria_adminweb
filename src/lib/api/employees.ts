import { api } from "@/lib/api";

export type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  dui?: string | null;
  nit?: string | null;
  positionId?: string | null;
  departmentId?: string | null;
  hireDate: string;
  baseSalary: string | number;
  contractType: string;
  salaryType: string;
  phone?: string | null;
  email?: string | null;
  canSell: boolean;
  canCashier: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  position?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
};

export type EmployeesListResult = {
  items: EmployeeRow[];
  total: number;
  take: number;
  skip: number;
};

export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  hireDate: string;
  baseSalary: number;
  dui?: string | null;
  nit?: string | null;
  positionId?: string | null;
  departmentId?: string | null;
  contractType?: string;
  salaryType?: string;
  phone?: string | null;
  email?: string | null;
  canSell?: boolean;
  canCashier?: boolean;
  pin?: string | null;
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput> & {
  isActive?: boolean;
};

export type DepartmentRow = {
  id: string;
  name: string;
  positions?: { id: string; name: string; isActive: boolean }[];
};

export type PositionRow = {
  id: string;
  name: string;
  departmentId: string;
  department?: { id: string; name: string };
};

export const employeesApi = {
  list: (params?: { q?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    const qs = search.toString();
    return api.get<EmployeesListResult>(`/employees${qs ? `?${qs}` : ""}`);
  },
  create: (data: CreateEmployeeInput) => api.post<EmployeeRow>("/employees", data),
  update: (id: string, data: UpdateEmployeeInput) =>
    api.patch<EmployeeRow>(`/employees/${id}`, data),
};

export const catalogsApi = {
  departments: () => api.get<DepartmentRow[]>("/departments"),
  positions: (departmentId?: string) => {
    const qs = departmentId ? `?departmentId=${departmentId}` : "";
    return api.get<PositionRow[]>(`/positions${qs}`);
  },
};
