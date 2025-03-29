import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Define interfaces for the data types
interface Department {
  id: number;
  name: string;
}

interface Position {
  id: number;
  title: string;
}

interface Partner {
  id: number;
  company_name: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

interface FinancialReport {
  id: number;
  title: string;
  type: string;
}

interface PerformanceReview {
  id: number;
  title: string;
  employee_id: number;
}

interface ClientPayment {
  id: number;
  client_id: number;
  amount: number;
  payment_date: string;
}

interface Client {
  id: number;
  business_name?: string;
  first_name?: string;
  last_name?: string;
}

export interface PageNameConfig {
  employees: Record<string, string>;
  partners: Record<string, string>;
  expenses: Record<string, string>;
  performance: Record<string, string>;
}

interface SectionNameMap {
  [key: string]: string;
}

class PageNameService {
  private static instance: PageNameService;
  private employeeNames: SectionNameMap = {};
  private clientNames: SectionNameMap = {};
  private partnerNames: SectionNameMap = {};
  private expenseNames: SectionNameMap = {};
  private performanceNames: SectionNameMap = {};
  private paymentNames: SectionNameMap = {};
  private lastFetchTime: number = 0;
  private isFetching: boolean = false;
  private fetchPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): PageNameService {
    if (!PageNameService.instance) {
      PageNameService.instance = new PageNameService();
    }
    return PageNameService.instance;
  }

  public get allNames(): SectionNameMap {
    return {
      ...this.employeeNames,
      ...this.partnerNames,
      ...this.expenseNames,
      ...this.performanceNames,
      ...this.paymentNames
    };
  }

  public get employeePageNames(): SectionNameMap {
    return { ...this.employeeNames };
  }

  public get partnerPageNames(): SectionNameMap {
    return { ...this.partnerNames };
  }

  public get expensePageNames(): SectionNameMap {
    return { ...this.expenseNames };
  }

  public get performancePageNames(): SectionNameMap {
    return { ...this.performanceNames };
  }
  
  public get paymentPageNames(): SectionNameMap {
    return { ...this.paymentNames };
  }

  public async fetchPageNames(force: boolean = false): Promise<void> {
    // Add debug logging
    console.log(`fetchPageNames called. Force: ${force}, Last fetch: ${new Date(this.lastFetchTime).toLocaleTimeString()}`);
    
    // If already fetching, return the existing promise
    if (this.isFetching && this.fetchPromise) {
      console.log('Already fetching page names, returning existing promise');
      return this.fetchPromise;
    }

    // If data is less than 5 minutes old, don't refetch unless forced
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (!force && this.lastFetchTime > 0 && now - this.lastFetchTime < fiveMinutes) {
      console.log('Page names are fresh (less than 5 minutes old), skipping fetch');
      return Promise.resolve();
    }

    this.isFetching = true;
    console.log('Starting new fetch of page names');
    this.fetchPromise = this.doFetchPageNames();
    return this.fetchPromise;
  }

  private async doFetchPageNames(): Promise<void> {
    try {
      // Fetch departments for employee section
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .limit(20);
      
      if (deptError) console.log('Error fetching departments:', deptError.message);
      
      // Fetch positions for employee section
      const { data: positions, error: posError } = await supabase
        .from('positions')
        .select('id, title')
        .limit(20);
      
      if (posError) console.log('Error fetching positions:', posError.message);
      
      // Fetch partners 
      const { data: partners, error: partnerError } = await supabase
        .from('partners')
        .select('id, company_name')
        .limit(20);
      
      if (partnerError) console.log('Error fetching partners:', partnerError.message);
      
      // Fetch expense categories
      const { data: expenseCategories, error: expenseError } = await supabase
        .from('expense_categories')
        .select('id, name')
        .limit(20);
      
      if (expenseError) console.log('Error fetching expense categories:', expenseError.message);
      
      // Fetch employees
      let employees: Employee[] | null = null;
      try {
        const { data, error: empError } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .limit(20);
        
        employees = data;
        
        if (empError) {
          console.log('Error fetching employees from primary query:', empError.message);
          
          // Try an alternative query if the first one fails
          console.log('Attempting alternative employee query...');
          const { data: altData, error: altError } = await supabase
            .from('employees')
            .select('*')
            .limit(20);
          
          if (altError) {
            console.log('Alternative employee query also failed:', altError.message);
          } else if (altData && altData.length > 0) {
            // Extract just the fields we need
            employees = altData.map(emp => ({
              id: emp.id,
              first_name: emp.first_name || '',
              last_name: emp.last_name || ''
            }));
            console.log(`Alternative query successful, found ${employees.length} employees`);
          }
        }
      } catch (error) {
        console.error('Exception while fetching employees:', error);
      }
      
      // Log employee fetch results for debugging
      console.log(`Fetched ${employees?.length || 0} employees from the database`);
      if (employees && employees.length > 0) {
        console.log('First employee sample:', JSON.stringify(employees[0]));
      } else {
        console.warn('⚠️ No employees found in database. Creating fallback data.');
        // Create fallback data if no employees were found
        employees = [
          { id: 1, first_name: 'Sample', last_name: 'Employee' },
          { id: 2, first_name: 'Test', last_name: 'User' }
        ];
      }
      
      // Fetch performance reviews - handle case where table might not exist
      let performanceReviews: PerformanceReview[] | null = null;
      try {
        const { data, error } = await supabase
          .from('performance_reviews')
          .select('id, title, employee_id')
          .limit(20);
          
        performanceReviews = data;
        if (error) console.log('Error fetching performance reviews:', error.message);
      } catch (error) {
        console.log('Performance reviews table not available');
      }
      
      // Fetch payments - handle case where table might not exist
      let payments: ClientPayment[] | null = null;
      try {
        const { data, error } = await supabase
          .from('client_payments')
          .select('id, client_id, amount, payment_date')
          .limit(20);
          
        payments = data;
        if (error) console.log('Error fetching payments:', error.message);
      } catch (error) {
        console.log('Payments table not available');
      }
      
      // Fetch clients for payment references - handle case where table might not exist
      let clients: Client[] | null = null;
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, business_name, first_name, last_name')
          .limit(20);
          
        clients = data;
        if (error) console.log('Error fetching clients:', error.message);
      } catch (error) {
        console.log('Clients table not available');
      }

      // Process employee data
      const employeePages: SectionNameMap = {};
      
      if (departments) {
        departments.forEach((dept: Department) => {
          employeePages[`department-${dept.id}`] = dept.name;
        });
      }
      
      if (positions) {
        positions.forEach((pos: Position) => {
          employeePages[`position-${pos.id}`] = pos.title;
        });
      }

      if (employees) {
        employees.forEach((emp: Employee) => {
          // Make sure we have valid name components
          const firstName = emp.first_name || '';
          const lastName = emp.last_name || '';
          
          // Create the full name with fallback
          const fullName = `${firstName} ${lastName}`.trim() || `Employee #${emp.id}`;
          
          // Set the name in our mapping
          employeePages[`employee-${emp.id}`] = fullName;
          
          // Log each employee name mapping for debugging
          console.log(`Mapped employee ID ${emp.id} to name "${fullName}"`);
        });
        
        // Log total number of employee name mappings
        console.log(`Created ${Object.keys(employeePages).length} employee name mappings`);
      } else {
        console.warn('No employee data available for page name mapping');
      }
      
      // Add general purpose section names
      employeePages['performance'] = 'Performance Reviews';
      employeePages['departments'] = 'Departments';
      employeePages['positions'] = 'Job Positions';
      employeePages['salary'] = 'Salary Management';
      
      // Process partner data
      const partnerPages: SectionNameMap = {};
      if (partners) {
        partners.forEach((partner: Partner) => {
          partnerPages[`partner-${partner.id}`] = partner.company_name;
        });
      }
      
      // Add general partner section names
      partnerPages['distribution'] = 'Profit Distribution';
      partnerPages['commission'] = 'Commission Tracking';
      
      // Process expense data
      const expensePages: SectionNameMap = {};
      if (expenseCategories) {
        expenseCategories.forEach((category: ExpenseCategory) => {
          expensePages[`category-${category.id}`] = category.name;
        });
      }
      
      // Add general expense section names
      expensePages['budget'] = 'Budget Planning';
      expensePages['categories'] = 'Expense Categories';
      
      // Process performance review data
      const performancePages: SectionNameMap = {};
      if (performanceReviews && employees) {
        performanceReviews.forEach((review: PerformanceReview) => {
          performancePages[`review-${review.id}`] = review.title;
          
          // Find employee associated with review
          const employee = employees.find(emp => emp.id === review.employee_id);
          if (employee) {
            performancePages[`review-employee-${review.id}`] = `${employee.first_name} ${employee.last_name}'s Review`;
          }
        });
      }
      
      // Process payment data
      const paymentPages: SectionNameMap = {};
      if (payments && clients) {
        payments.forEach((payment: ClientPayment) => {
          // Find client associated with payment
          const client = clients.find((c: Client) => c.id === payment.client_id);
          if (client) {
            const clientName = client.business_name || 
              `${client.first_name || ''} ${client.last_name || ''}`.trim();
            
            paymentPages[`payment-${payment.id}`] = `Payment - ${clientName}`;
            
            // Format payment date if available
            if (payment.payment_date) {
              const date = new Date(payment.payment_date);
              const formattedDate = date.toLocaleDateString();
              paymentPages[`payment-date-${payment.id}`] = `${formattedDate} - ${clientName}`;
            }
          } else {
            paymentPages[`payment-${payment.id}`] = `Payment #${payment.id}`;
          }
        });
      }
      
      this.employeeNames = employeePages;
      this.partnerNames = partnerPages;
      this.expenseNames = expensePages;
      this.performanceNames = performancePages;
      this.paymentNames = paymentPages;
      this.lastFetchTime = Date.now();

    } catch (error) {
      console.error('Error fetching page names:', error);
    } finally {
      this.isFetching = false;
      this.fetchPromise = null;
    }
  }
}

export default PageNameService; 