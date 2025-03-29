import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Define the response types for Gemini API
interface GeminiContent {
  parts: {
    text: string;
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: any[];
  };
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  tools?: any[];
}

// Define app action types for Gemini to interact with
export enum AppActionType {
  SEND_MESSAGE = 'SEND_MESSAGE',
  CREATE_TASK = 'CREATE_TASK',
  SCHEDULE_MEETING = 'SCHEDULE_MEETING',
  SEARCH_CLIENTS = 'SEARCH_CLIENTS',
  ANALYZE_DATA = 'ANALYZE_DATA',
  GENERATE_REPORT = 'GENERATE_REPORT',
  CREATE_CLIENT = 'CREATE_CLIENT',
  CREATE_CLIENT_PAYMENT = 'CREATE_CLIENT_PAYMENT',
  PAY_SALARY = 'PAY_SALARY',
  CREATE_EMPLOYEE = 'CREATE_EMPLOYEE',
  UPDATE_CLIENT = 'UPDATE_CLIENT',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  CREATE_EXPENSE = 'CREATE_EXPENSE',
  MANAGE_EXPENSE = 'MANAGE_EXPENSE',
  CREATE_PARTNER = 'CREATE_PARTNER',
  ASSIGN_TASK = 'ASSIGN_TASK',
  COMPLETE_TASK = 'COMPLETE_TASK',
  CREATE_DEPARTMENT = 'CREATE_DEPARTMENT',
  CREATE_POSITION = 'CREATE_POSITION',
  GENERATE_INVOICE = 'GENERATE_INVOICE',
}

export interface AppAction {
  type: AppActionType;
  payload: any;
}

class GeminiService {
  private static instance: GeminiService;
  private apiKey: string = '';
  private apiUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private permissionLevel: 'basic' | 'enhanced' | 'full' = 'basic';
  private systemContext: string = '';
  private conversationHistory: Array<{ role: 'user' | 'model' | 'system', content: string }> = [];

  private constructor() {
    // Initialize with empty API key - will be set later
    this.loadApiKey();
    this.loadPermissionLevel();
    this.setDefaultSystemContext();
  }

  private async loadApiKey() {
    try {
      const storedApiKey = await AsyncStorage.getItem('gemini_api_key');
      if (storedApiKey) {
        this.apiKey = storedApiKey;
      } else {
        // Default to the provided API key
        this.apiKey = 'AIzaSyDmQXT922VZD7bZElRXRcQ9GGbswMWNSr4';
        // Save the default key to storage so it persists
        await AsyncStorage.setItem('gemini_api_key', this.apiKey);
      }
    } catch (error) {
      console.warn('Failed to load Gemini API key', error);
      // Set default key even if there's an error
      this.apiKey = 'AIzaSyDmQXT922VZD7bZElRXRcQ9GGbswMWNSr4';
    }
  }

  private async loadPermissionLevel() {
    try {
      const permissionLevel = await AsyncStorage.getItem('gemini_permission_level');
      if (permissionLevel && ['basic', 'enhanced', 'full'].includes(permissionLevel as any)) {
        this.permissionLevel = permissionLevel as 'basic' | 'enhanced' | 'full';
      }
    } catch (error) {
      console.warn('Failed to load Gemini permission level', error);
    }
  }

  private setDefaultSystemContext() {
    // Set the default system context based on permission level
    const systemContextMap = {
      basic: `You are Gemini, an AI assistant for the Story Lab business management app. You can have conversations and answer questions about business operations.`,
      
      enhanced: `You are Gemini, an AI assistant for the Story Lab business management app. You can have conversations, answer questions, and perform simple app functions like searching for information and creating tasks.
      
      Available actions: 
      - SEARCH_CLIENTS: Find clients by name or other criteria
      - CREATE_TASK: Create a task with title, description, priority, and due date
      - ANALYZE_DATA: Perform basic data analysis on provided information
      - SEND_MESSAGE: Send a message to a user
      - SCHEDULE_MEETING: Schedule a meeting with title, description, date, and participants`,
      
      full: `You are Gemini, an AI assistant for the Story Lab business management app with full capability to interact with the app's database and functions.
      
      Available actions:
      - SEARCH_CLIENTS: Find clients by name or other criteria
      - CREATE_TASK: Create a task with title, description, priority, and due date
      - ANALYZE_DATA: Perform data analysis on business metrics
      - SEND_MESSAGE: Send a message to a user
      - SCHEDULE_MEETING: Schedule a meeting with title, description, date, and participants
      - GENERATE_REPORT: Create a report based on business data
      - CREATE_CLIENT: Add a new client to the database
      - CREATE_CLIENT_PAYMENT: Record a payment from a client
      - PAY_SALARY: Process a salary payment to an employee
      - CREATE_EMPLOYEE: Add a new employee to the database
      - UPDATE_CLIENT: Update information for an existing client
      - UPDATE_EMPLOYEE: Update information for an existing employee
      - CREATE_EXPENSE: Add a new expense record
      - MANAGE_EXPENSE: Update or categorize expense records
      - CREATE_PARTNER: Add a new business partner
      - ASSIGN_TASK: Assign a task to a specific employee
      - COMPLETE_TASK: Mark a task as completed
      - CREATE_DEPARTMENT: Create a new department in the organization
      - CREATE_POSITION: Create a new job position
      - GENERATE_INVOICE: Create an invoice for a client
      
      When asked to perform these actions, extract all necessary information and return a properly formatted action object.`,
    };

    this.systemContext = systemContextMap[this.permissionLevel] || systemContextMap.basic;
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    AsyncStorage.setItem('gemini_api_key', apiKey);
  }

  public async setPermissionLevel(level: 'basic' | 'enhanced' | 'full'): Promise<void> {
    this.permissionLevel = level;
    await AsyncStorage.setItem('gemini_permission_level', level);
    this.setDefaultSystemContext(); // Update system context with new permission level
    
    return Promise.resolve();
  }

  public getPermissionLevel(): string {
    return this.permissionLevel;
  }

  public clearConversation(): void {
    this.conversationHistory = [];
  }

  public setSystemContext(context: string): void {
    this.systemContext = context;
    // Don't add system context to conversation history
    // The formatConversationHistory method will handle adding it to the API request
  }

  private formatConversationHistory() {
    // The simplest approach to make it work with Gemini-2.0-flash
    // This version creates a very straightforward format that works reliably
    
    // Create a single content object with parts
    const content: GeminiContent = {
      parts: []
    };
    
    // Always start with the system message
    if (this.systemContext) {
      content.parts.push({ text: this.systemContext });
    }
    
    // Add each message in the history as a part
    // Gemini will figure out the alternating pattern
    for (const message of this.conversationHistory.slice(-10)) {
      content.parts.push({ text: message.content });
    }
    
    // Return array with just one content object containing all messages
    return [content];
  }

  public async generateContent(prompt: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not set');
      }

      // Add the user prompt to conversation history
      this.conversationHistory.push({ role: 'user', content: prompt });

      // Format the conversation history for the API
      const formattedContents = this.formatConversationHistory();

      // Log for debugging
      console.log('Formatted content count:', formattedContents.length);
      if (formattedContents.length > 0) {
        console.log('Parts in last content object:', formattedContents[formattedContents.length - 1].parts.length);
      }

      const requestBody: GeminiRequest = {
        contents: formattedContents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };

      console.log('Sending request to Gemini API...');
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error response:', errorData);
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      // Check if the response was blocked for safety reasons
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Prompt blocked: ${data.promptFeedback.blockReason}`);
      }

      // Extract the generated text from the response
      if (data.candidates && data.candidates.length > 0) {
        const responseText = data.candidates[0].content.parts.map(part => part.text).join('');
        
        // Add the model's response to conversation history
        this.conversationHistory.push({ role: 'model', content: responseText });
        
        return responseText;
      } else {
        throw new Error('No response generated');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  // Method to execute actions in the app based on Gemini's response
  public async executeAction(action: AppAction): Promise<boolean | any[]> {
    try {
      console.log('Executing action:', action.type);
      
      switch (action.type) {
        case AppActionType.SEND_MESSAGE:
          return await this.sendChatMessage(action.payload.message, action.payload.userId);
        
        case AppActionType.CREATE_TASK:
          return await this.createTask(action.payload);
        
        case AppActionType.SCHEDULE_MEETING:
          return await this.scheduleMeeting(action.payload);
        
        case AppActionType.SEARCH_CLIENTS:
          return await this.searchClients(action.payload.query);
        
        case AppActionType.ANALYZE_DATA:
          return await this.analyzeData(action.payload);
        
        case AppActionType.GENERATE_REPORT:
          return await this.generateReport(action.payload);
        
        case AppActionType.CREATE_CLIENT:
          return await this.createClient(action.payload);
          
        case AppActionType.CREATE_CLIENT_PAYMENT:
          return await this.createClientPayment(action.payload);
          
        case AppActionType.PAY_SALARY:
          return await this.paySalary(action.payload);
          
        case AppActionType.CREATE_EMPLOYEE:
          return await this.createEmployee(action.payload);
          
        // New actions
        case AppActionType.UPDATE_CLIENT:
          return await this.updateClient(action.payload);
          
        case AppActionType.UPDATE_EMPLOYEE:
          return await this.updateEmployee(action.payload);
          
        case AppActionType.CREATE_EXPENSE:
          return await this.createExpense(action.payload);
          
        case AppActionType.MANAGE_EXPENSE:
          return await this.manageExpense(action.payload);
          
        case AppActionType.CREATE_PARTNER:
          return await this.createPartner(action.payload);
          
        case AppActionType.ASSIGN_TASK:
          return await this.assignTask(action.payload);
          
        case AppActionType.COMPLETE_TASK:
          return await this.completeTask(action.payload);
          
        case AppActionType.CREATE_DEPARTMENT:
          return await this.createDepartment(action.payload);
          
        case AppActionType.CREATE_POSITION:
          return await this.createPosition(action.payload);
          
        case AppActionType.GENERATE_INVOICE:
          return await this.generateInvoice(action.payload);
          
        default:
          console.warn(`Unknown action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      return false;
    }
  }

  // Helper methods for actions
  private async sendChatMessage(message: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          message: message,
          message_type: 'text'
        });

      return !error;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  private async createTask(taskData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.dueDate,
          assigned_to: taskData.assignedTo,
          status: 'pending'
        });

      return !error;
    } catch (error) {
      console.error('Error creating task:', error);
      return false;
    }
  }

  private async searchClients(query: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  }

  // New method to get client details by ID
  private async getClientById(clientId: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching client details:', error);
      return null;
    }
  }

  // New method to get all clients (limited count)
  public async getAllClients(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  // New method to get employee details by ID
  private async getEmployeeById(employeeId: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*, departments:department_id(name), positions:position_id(name)')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching employee details:', error);
      return null;
    }
  }

  // New method to get all employees (limited count)
  public async getAllEmployees(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*, departments:department_id(name), positions:position_id(name)')
        .order('last_name', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  private async scheduleMeeting(payload: any): Promise<boolean> {
    try {
      console.log('Scheduling meeting with payload:', payload);
      // In a real implementation, this would create a calendar entry or database record
      
      // For demonstration purposes, we'll just log the meeting details
      const meetingDetails = {
        title: payload.title || 'Untitled Meeting',
        description: payload.description || '',
        date: payload.date || new Date().toISOString(),
        participants: payload.participants || [],
        location: payload.location || 'Virtual',
        created_at: new Date().toISOString()
      };
      
      console.log('Meeting scheduled:', meetingDetails);
      
      // Return success
      return true;
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      return false;
    }
  }

  private async analyzeData(payload: any): Promise<any[]> {
    try {
      console.log('Analyzing data with payload:', payload);
      // In a real implementation, this would process data sets and return results
      
      // For demonstration purposes, we'll return mock analysis results
      const dataset = payload.dataset || 'sales';
      const period = payload.period || 'month';
      
      // Generate some random data for the analysis
      const dataPoints = Array.from({ length: 5 }, (_, i) => ({
        label: `Data point ${i + 1}`,
        value: Math.floor(Math.random() * 1000),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }));
      
      const analysisResults = {
        dataset,
        period,
        timestamp: new Date().toISOString(),
        summary: `Analysis of ${dataset} data for the ${period} period completed successfully.`,
        dataPoints
      };
      
      console.log('Analysis results:', analysisResults);
      
      // Return the analysis results
      return [analysisResults];
    } catch (error) {
      console.error('Error analyzing data:', error);
      return [];
    }
  }

  private async generateReport(payload: any): Promise<any> {
    try {
      console.log('Generating report with payload:', payload);
      // In a real implementation, this would create a PDF or document
      
      // For demonstration purposes, we'll just return report metadata
      const reportDetails = {
        title: payload.title || 'Untitled Report',
        type: payload.type || 'summary',
        period: payload.period || 'monthly',
        generated_at: new Date().toISOString(),
        status: 'completed',
        url: 'https://example.com/reports/demo-report.pdf'
      };
      
      console.log('Report generated:', reportDetails);
      
      // Return the report details
      return reportDetails;
    } catch (error) {
      console.error('Error generating report:', error);
      return null;
    }
  }

  private async createClient(payload: any): Promise<boolean> {
    try {
      console.log('Creating client with payload:', payload);
      
      // Required fields validation
      if (!payload.name) {
        throw new Error('Client name is required');
      }
      
      // Create the client record in database
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: payload.name,
          email: payload.email || null,
          phone_number: payload.phone || payload.phoneNumber || null,
          address: payload.address || null,
          company: payload.company || null,
          status: payload.status || 'active',
          notes: payload.notes || null,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        throw error;
      }
      
      console.log('Client created successfully:', data);
      return true;
    } catch (error) {
      console.error('Error creating client:', error);
      return false;
    }
  }

  private async createClientPayment(payload: any): Promise<boolean> {
    try {
      console.log('Creating client payment with payload:', payload);
      
      // Required fields validation
      if (!payload.clientId && !payload.client_id) {
        throw new Error('Client ID is required');
      }
      
      if (!payload.amount) {
        throw new Error('Payment amount is required');
      }
      
      // Create the client payment record in database
      const { data, error } = await supabase
        .from('client_payments')
        .insert({
          client_id: payload.clientId || payload.client_id,
          amount: parseFloat(payload.amount),
          payment_date: payload.date || payload.paymentDate || new Date().toISOString(),
          payment_method: payload.method || payload.paymentMethod || 'other',
          description: payload.description || payload.notes || null,
          status: payload.status || 'completed',
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        throw error;
      }
      
      console.log('Client payment created successfully:', data);
      return true;
    } catch (error) {
      console.error('Error creating client payment:', error);
      return false;
    }
  }

  private async paySalary(payload: any): Promise<boolean> {
    try {
      console.log('Processing salary payment with payload:', payload);
      
      // Required fields validation
      if (!payload.employeeId && !payload.employee_id) {
        throw new Error('Employee ID is required');
      }
      
      if (!payload.amount) {
        throw new Error('Payment amount is required');
      }
      
      // Create the salary payment record in database
      const { data, error } = await supabase
        .from('salary_payments')
        .insert({
          employee_id: payload.employeeId || payload.employee_id,
          amount: parseFloat(payload.amount),
          payment_date: payload.date || payload.paymentDate || new Date().toISOString(),
          payment_type: payload.type || payload.paymentType || 'salary',
          description: payload.description || payload.notes || 'Monthly salary',
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        throw error;
      }
      
      console.log('Salary payment processed successfully:', data);
      return true;
    } catch (error) {
      console.error('Error processing salary payment:', error);
      return false;
    }
  }

  private async createEmployee(payload: any): Promise<boolean> {
    try {
      console.log('Creating employee with payload:', payload);
      
      // Required fields validation
      if (!payload.firstName && !payload.first_name) {
        throw new Error('Employee first name is required');
      }
      
      if (!payload.lastName && !payload.last_name) {
        throw new Error('Employee last name is required');
      }
      
      // Create the employee record in database
      const { data, error } = await supabase
        .from('employees')
        .insert({
          first_name: payload.firstName || payload.first_name,
          last_name: payload.lastName || payload.last_name,
          email: payload.email || null,
          phone_number: payload.phone || payload.phoneNumber || payload.phone_number || null,
          department_id: payload.departmentId || payload.department_id || null,
          position_id: payload.positionId || payload.position_id || null,
          employment_status: payload.status || payload.employmentStatus || payload.employment_status || 'active',
          base_salary: payload.salary || payload.baseSalary || payload.base_salary || null,
          hire_date: payload.hireDate || payload.hire_date || new Date().toISOString(),
          office_location: payload.location || payload.officeLocation || payload.office_location || null,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        throw error;
      }
      
      console.log('Employee created successfully:', data);
      return true;
    } catch (error) {
      console.error('Error creating employee:', error);
      return false;
    }
  }

  // Add a method to test Gemini capabilities with the current permission level
  public async testCapabilities(): Promise<string> {
    try {
      // Check if using the default API key
      const isUsingDefaultKey = this.apiKey === 'AIzaSyDmQXT922VZD7bZElRXRcQ9GGbswMWNSr4';
      
      // Start completely fresh for the test
      this.clearConversation();
      
      let testPrompt = "Show me what capabilities you have with the current permission level in Story Lab. Can you perform actions in this app?";
      
      // If using default key, add that information to the prompt
      if (isUsingDefaultKey) {
        testPrompt = "I'm using the default API key for Story Lab. " + testPrompt;
      }
      
      try {
        // First attempt - full featured prompt
        return await this.generateContent(testPrompt);
      } catch (firstError) {
        console.log('First test attempt failed, trying simpler prompt');
        
        // Clear history again to start fresh
        this.clearConversation();
        
        try {
          // Second attempt - simple prompt
          return await this.generateContent("Hello! What can you help me with in Story Lab?");
        } catch (secondError) {
          console.log('Second test attempt failed, trying minimal prompt');
          
          // Clear history again to start fresh
          this.clearConversation();
          
          // Third attempt - absolute minimal prompt
          return await this.generateContent("Hello");
        }
      }
    } catch (error) {
      console.error('Error testing Gemini capabilities (all attempts failed):', error);
      return "There was an error connecting to the Gemini AI. Please check your API key and internet connection, then try again.";
    }
  }

  // Add debug method to get API status
  public async checkApiStatus(): Promise<string> {
    try {
      // Make a basic request to confirm API is working
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return `API Error: ${errorData.error?.message || response.statusText}`;
      }
      
      const data = await response.json();
      return `API Status: Connected. Available models: ${data.models ? data.models.length : 'Unknown'}`;
    } catch (error) {
      return `API Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  // Get debug info about the current state
  public getDebugInfo(): string {
    return JSON.stringify({
      apiKeySet: !!this.apiKey,
      apiKeyIsDefault: this.apiKey === 'AIzaSyDmQXT922VZD7bZElRXRcQ9GGbswMWNSr4',
      permissionLevel: this.permissionLevel,
      conversationHistoryLength: this.conversationHistory.length,
      systemContextLength: this.systemContext.length,
    }, null, 2);
  }

  // Simple method for text-only queries - completely fresh context
  public async generateSimpleResponse(text: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not set');
      }

      // Simple request body with just the text prompt
      const requestBody = {
        contents: [
          {
            parts: [
              { text }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };

      console.log('Sending simple text-only request to Gemini API...');
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error response:', errorData);
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts.map((part: any) => part.text).join('');
      } else {
        throw new Error('No response generated for simple query');
      }
    } catch (error) {
      console.error('Error generating simple response:', error);
      throw error;
    }
  }

  // New methods for additional actions
  private async updateClient(payload: any): Promise<boolean> {
    try {
      const { clientId, ...updates } = payload;
      
      if (!clientId) {
        console.error("Client ID is required for UPDATE_CLIENT action");
        return false;
      }
      
      // Convert camelCase keys to snake_case for database
      const dbUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        dbUpdates[snakeKey] = value;
      });
      
      const { error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .eq('id', clientId);
      
      if (error) {
        console.error("Error updating client:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in updateClient:", error);
      return false;
    }
  }
  
  private async updateEmployee(payload: any): Promise<boolean> {
    try {
      const { employeeId, ...updates } = payload;
      
      if (!employeeId) {
        console.error("Employee ID is required for UPDATE_EMPLOYEE action");
        return false;
      }
      
      // Convert camelCase keys to snake_case for database
      const dbUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        dbUpdates[snakeKey] = value;
      });
      
      const { error } = await supabase
        .from('employees')
        .update(dbUpdates)
        .eq('id', employeeId);
      
      if (error) {
        console.error("Error updating employee:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in updateEmployee:", error);
      return false;
    }
  }
  
  private async createExpense(payload: any): Promise<boolean> {
    try {
      const {
        amount,
        description,
        category,
        date = new Date().toISOString().split('T')[0],
        paymentMethod = 'cash',
        receipt = null,
        isReimbursable = false,
        employeeId = null,
        projectId = null,
        clientId = null,
        status = 'pending', // pending, approved, rejected
      } = payload;
      
      if (!amount || !description) {
        console.error("Amount and description are required for CREATE_EXPENSE action");
        return false;
      }
      
      const { error } = await supabase
        .from('expenses')
        .insert({
          amount,
          description,
          category,
          date,
          payment_method: paymentMethod,
          receipt_url: receipt,
          is_reimbursable: isReimbursable,
          employee_id: employeeId,
          project_id: projectId,
          client_id: clientId,
          status,
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error("Error creating expense:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in createExpense:", error);
      return false;
    }
  }
  
  private async manageExpense(payload: any): Promise<boolean> {
    try {
      const { expenseId, action, ...updates } = payload;
      
      if (!expenseId) {
        console.error("Expense ID is required for MANAGE_EXPENSE action");
        return false;
      }
      
      if (action === 'approve') {
        const { error } = await supabase
          .from('expenses')
          .update({ status: 'approved' })
          .eq('id', expenseId);
          
        if (error) {
          console.error("Error approving expense:", error);
          return false;
        }
      } else if (action === 'reject') {
        const { error } = await supabase
          .from('expenses')
          .update({ status: 'rejected' })
          .eq('id', expenseId);
          
        if (error) {
          console.error("Error rejecting expense:", error);
          return false;
        }
      } else if (action === 'update') {
        // Convert camelCase keys to snake_case for database
        const dbUpdates: Record<string, any> = {};
        Object.entries(updates).forEach(([key, value]) => {
          // Convert camelCase to snake_case
          const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          dbUpdates[snakeKey] = value;
        });
        
        const { error } = await supabase
          .from('expenses')
          .update(dbUpdates)
          .eq('id', expenseId);
          
        if (error) {
          console.error("Error updating expense:", error);
          return false;
        }
      } else {
        console.error("Invalid action for MANAGE_EXPENSE");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in manageExpense:", error);
      return false;
    }
  }
  
  private async createPartner(payload: any): Promise<boolean> {
    try {
      const {
        name,
        email,
        phone,
        type = 'individual', // individual, company
        address = null,
        website = null,
        notes = null,
        partnershipStartDate = new Date().toISOString().split('T')[0],
        partnershipAgreement = null,
        commissionRate = null,
        status = 'active',
      } = payload;
      
      if (!name || !email) {
        console.error("Name and email are required for CREATE_PARTNER action");
        return false;
      }
      
      const { error } = await supabase
        .from('partners')
        .insert({
          name,
          email,
          phone,
          type,
          address,
          website,
          notes,
          partnership_start_date: partnershipStartDate,
          partnership_agreement: partnershipAgreement,
          commission_rate: commissionRate,
          status,
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error("Error creating partner:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in createPartner:", error);
      return false;
    }
  }
  
  private async assignTask(payload: any): Promise<boolean> {
    try {
      const { taskId, employeeId } = payload;
      
      if (!taskId || !employeeId) {
        console.error("Task ID and Employee ID are required for ASSIGN_TASK action");
        return false;
      }
      
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: employeeId })
        .eq('id', taskId);
      
      if (error) {
        console.error("Error assigning task:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in assignTask:", error);
      return false;
    }
  }
  
  private async completeTask(payload: any): Promise<boolean> {
    try {
      const { taskId, completionNotes = null } = payload;
      
      if (!taskId) {
        console.error("Task ID is required for COMPLETE_TASK action");
        return false;
      }
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completion_notes: completionNotes,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      if (error) {
        console.error("Error completing task:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in completeTask:", error);
      return false;
    }
  }
  
  private async createDepartment(payload: any): Promise<boolean> {
    try {
      const {
        name,
        description = null,
        managerId = null,
        parentDepartmentId = null,
        budget = null,
        location = null,
      } = payload;
      
      if (!name) {
        console.error("Department name is required for CREATE_DEPARTMENT action");
        return false;
      }
      
      const { error } = await supabase
        .from('departments')
        .insert({
          name,
          description,
          manager_id: managerId,
          parent_department_id: parentDepartmentId,
          budget,
          location,
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error("Error creating department:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in createDepartment:", error);
      return false;
    }
  }
  
  private async createPosition(payload: any): Promise<boolean> {
    try {
      const {
        title,
        departmentId,
        description = null,
        requirements = null,
        responsibilities = null,
        minSalary = null,
        maxSalary = null,
        isRemote = false,
        isFullTime = true,
      } = payload;
      
      if (!title || !departmentId) {
        console.error("Title and department ID are required for CREATE_POSITION action");
        return false;
      }
      
      const { error } = await supabase
        .from('positions')
        .insert({
          title,
          department_id: departmentId,
          description,
          requirements,
          responsibilities,
          min_salary: minSalary,
          max_salary: maxSalary,
          is_remote: isRemote,
          is_full_time: isFullTime,
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error("Error creating position:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in createPosition:", error);
      return false;
    }
  }
  
  private async generateInvoice(payload: any): Promise<boolean> {
    try {
      const {
        clientId,
        amount,
        dueDate,
        items = [],
        notes = null,
        paymentTerms = 'net30',
        discountAmount = 0,
        taxRate = 0,
      } = payload;
      
      if (!clientId || !amount || !dueDate) {
        console.error("Client ID, amount, and due date are required for GENERATE_INVOICE action");
        return false;
      }
      
      // Calculate totals
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || amount;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal - discountAmount + taxAmount;
      
      const { error, data } = await supabase
        .from('invoices')
        .insert({
          client_id: clientId,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate,
          subtotal,
          discount_amount: discountAmount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          notes,
          payment_terms: paymentTerms,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select();
      
      if (error) {
        console.error("Error creating invoice:", error);
        return false;
      }
      
      // If we have line items and the invoice was created successfully
      if (items.length > 0 && data && data[0]) {
        const invoiceId = data[0].id;
        
        // Add invoice items
        const invoiceItems = items.map((item: any) => ({
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unitPrice || item.amount,
          amount: item.amount,
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);
        
        if (itemsError) {
          console.error("Error adding invoice items:", itemsError);
          // Continue anyway since the main invoice was created
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error in generateInvoice:", error);
      return false;
    }
  }
}

export { GeminiService }; 