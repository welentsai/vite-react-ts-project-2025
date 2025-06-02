import { SourcePartConfig } from '@/pages/config-operation';
import { ConfigSaveRequest } from '@/pages/config-operation/types';
import { http, HttpResponse } from 'msw';

// Define the customer interface
export interface Customer {
  id: number;
  name: string;
  age: number;
  email: string;
  country: string;
  deleted?: boolean;
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'John Doe',
    age: 28,
    email: 'john@example.com',
    country: 'USA',
  },
  {
    id: 2,
    name: 'Jane Smith',
    age: 32,
    email: 'jane@example.com',
    country: 'Canada',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    age: 45,
    email: 'bob@example.com',
    country: 'UK',
  },
  {
    id: 4,
    name: 'Sarah Williams',
    age: 29,
    email: 'sarah@example.com',
    country: 'Australia',
  },
  {
    id: 5,
    name: 'Michael Brown',
    age: 36,
    email: 'michael@example.com',
    country: 'Germany',
  },
  {
    id: 6,
    name: 'Emily Davis',
    age: 24,
    email: 'emily@example.com',
    country: 'France',
  },
  {
    id: 7,
    name: 'David Wilson',
    age: 41,
    email: 'david@example.com',
    country: 'Spain',
  },
  {
    id: 8,
    name: 'Lisa Anderson',
    age: 33,
    email: 'lisa@example.com',
    country: 'Italy',
  },
];

let mockConfigs: SourcePartConfig[] = [
  {
    id: '1',
    sourcePart: 'aaa',
    binGrade: '1',
    targetPart: 'aaab',
    claimUser: 'WL',
    claimTime: '2025'
  },
  {
    id: '2',
    sourcePart: 'bbb',
    binGrade: '2',
    targetPart: 'bbbc',
    claimUser: 'WL',
    claimTime: '2025'
  },
  {
    id: '3',
    sourcePart: 'aaa',
    binGrade: 'x',
    targetPart: 'aaad',
    claimUser: 'WL',
    claimTime: '2025'
  },
]

export const handlers = [
  // GET /api/v1/customers
  http.get('http://abc.example.com/api/v1/customers', () => {
    return HttpResponse.json({
      success: true,
      data: mockCustomers,
      total: mockCustomers.length,
      page: 1,
      pageSize: 50,
    });
  }),

  // POST /api/v1/customers (Create new customer)
  http.post('http://abc.example.com/api/v1/customers', async ({ request }) => {
    const newCustomer = (await request.json()) as Omit<Customer, 'id'>;
    const customer: Customer = {
      id: Math.max(...mockCustomers.map(c => c.id)) + 1,
      ...newCustomer,
    };

    mockCustomers.push(customer);

    return HttpResponse.json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  }),

  // PUT /api/v1/customers/:id (Update customer)
  http.put('http://abc.example.com/api/v1/customers/:id', async ({ request, params }) => {
    const { id } = params;
    const updatedData = (await request.json()) as Partial<Customer>;

    const customerIndex = mockCustomers.findIndex(c => c.id === Number(id));

    if (customerIndex === -1) {
      return HttpResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    mockCustomers[customerIndex] = { ...mockCustomers[customerIndex], ...updatedData };

    return HttpResponse.json({
      success: true,
      data: mockCustomers[customerIndex],
      message: 'Customer updated successfully',
    });
  }),

  // DELETE /api/v1/customers/:id (Soft delete customer)
  http.delete('http://abc.example.com/api/v1/customers/:id', ({ params }) => {
    const { id } = params;
    const customerIndex = mockCustomers.findIndex(c => c.id === Number(id));

    if (customerIndex === -1) {
      return HttpResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    mockCustomers[customerIndex].deleted = true;

    return HttpResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  }),

  // POST /api/v1/customers/:id/restore (Restore deleted customer)
  http.post('http://abc.example.com/api/v1/customers/:id/restore', ({ params }) => {
    const { id } = params;
    const customerIndex = mockCustomers.findIndex(c => c.id === Number(id));

    if (customerIndex === -1) {
      return HttpResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    mockCustomers[customerIndex].deleted = false;

    return HttpResponse.json({
      success: true,
      data: mockCustomers[customerIndex],
      message: 'Customer restored successfully',
    });
  }),

  // GET /api/v1/configs
  http.get('http://example.com/api/configs', ({request}) => {
    const url = new URL(request.url)
    const sourcePart = url.searchParams.get('sourcePart')
    let filteredConfigs = mockConfigs
    // Filter by sourcePart if provided
    if (sourcePart) {
      filteredConfigs = mockConfigs.filter(config => 
        config.sourcePart.toLowerCase().includes(sourcePart.toLowerCase())
      )
    }
    return HttpResponse.json({
      success: true,
      data: filteredConfigs,
      total: mockConfigs.length,
      message: 'Success to fetch config !'
    });
  }),

  // POST /api/v1/configs
  http.post('http://example.com/api/configs', async ({ request }) => {
    const saveRequest = (await request.json()) as ConfigSaveRequest;

    console.log('mock post configs', saveRequest);

    mockConfigs = saveRequest.configs;

    return HttpResponse.json({
      success: true,
      data: mockConfigs,
      message: 'Customer created successfully',
    }, {status: 201});
  }),
];
