import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

/**
 * HR Service
 * Centralizes all HR-related database operations (employees, departments, leave)
 */

// Employee types
type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];
type EmployeeRow = Database['public']['Tables']['employees']['Row'];

/**
 * Employee Service
 */
export class EmployeeService {
  /**
   * Create a new employee
   */
  static async createEmployee(input: EmployeeInsert) {
    const { data, error } = await supabase
      .from('employees')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create employee: ${error.message}`);
    if (!data) throw new Error('Failed to create employee: No data returned');
    
    return data as EmployeeRow;
  }

  /**
   * Update an existing employee
   */
  static async updateEmployee(id: string, updates: EmployeeUpdate) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update employee: ${error.message}`);
    if (!data) throw new Error('Employee not found');
    
    return data as EmployeeRow;
  }

  /**
   * Delete an employee
   */
  static async deleteEmployee(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete employee: ${error.message}`);
  }

  /**
   * Get employees by customer
   */
  static async getEmployeesByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
    return data as EmployeeRow[];
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch employee: ${error.message}`);
    return data as EmployeeRow | null;
  }
}

// Department types
type DepartmentInsert = Database['public']['Tables']['departments']['Insert'];
type DepartmentUpdate = Database['public']['Tables']['departments']['Update'];
type DepartmentRow = Database['public']['Tables']['departments']['Row'];

/**
 * Department Service
 */
export class DepartmentService {
  static async createDepartment(input: DepartmentInsert) {
    const { data, error } = await supabase
      .from('departments')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create department: ${error.message}`);
    if (!data) throw new Error('Failed to create department: No data returned');
    
    return data as DepartmentRow;
  }

  static async updateDepartment(id: string, updates: DepartmentUpdate) {
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update department: ${error.message}`);
    if (!data) throw new Error('Department not found');
    
    return data as DepartmentRow;
  }

  static async deleteDepartment(id: string) {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete department: ${error.message}`);
  }

  static async getDepartmentsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('customer_id', customerId)
      .order('department_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch departments: ${error.message}`);
    return data as DepartmentRow[];
  }

  static async getDepartmentById(id: string) {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch department: ${error.message}`);
    return data as DepartmentRow | null;
  }
}

// Leave types
type LeaveInsert = Database['public']['Tables']['employee_leave']['Insert'];
type LeaveUpdate = Database['public']['Tables']['employee_leave']['Update'];
type LeaveRow = Database['public']['Tables']['employee_leave']['Row'];

/**
 * Leave Service
 */
export class LeaveService {
  static async createLeave(input: LeaveInsert) {
    const { data, error } = await supabase
      .from('employee_leave')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create leave request: ${error.message}`);
    if (!data) throw new Error('Failed to create leave request: No data returned');
    
    return data as LeaveRow;
  }

  static async updateLeave(id: string, updates: LeaveUpdate) {
    const { data, error } = await supabase
      .from('employee_leave')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update leave request: ${error.message}`);
    if (!data) throw new Error('Leave request not found');
    
    return data as LeaveRow;
  }

  static async deleteLeave(id: string) {
    const { error } = await supabase
      .from('employee_leave')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete leave request: ${error.message}`);
  }

  static async getLeaveByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('employee_leave')
      .select('*')
      .eq('customer_id', customerId)
      .order('requested_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch leave requests: ${error.message}`);
    return data as LeaveRow[];
  }

  static async getLeaveByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('employee_leave')
      .select('*')
      .eq('employee_id', employeeId)
      .order('requested_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch leave requests: ${error.message}`);
    return data as LeaveRow[];
  }

  static async getLeaveById(id: string) {
    const { data, error } = await supabase
      .from('employee_leave')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch leave request: ${error.message}`);
    return data as LeaveRow | null;
  }
}
