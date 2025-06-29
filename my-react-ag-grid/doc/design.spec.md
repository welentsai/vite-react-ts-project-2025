# TypeScript React Project Design Spec

## Executive Summary

This is a comprehensive guide for developing a modern, enterprise-grade TypeScript React application. The project emphasizes **maintainability**, **scalability**, **performance**, and **developer experience** through carefully chosen technologies and architectural patterns.

### Quick Reference
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 + Ant Design
- **Data Grid**: ag-Grid React
- **State Management**: useReducer + React Query
- **Testing**: Vitest + React Testing Library
- **Architecture**: Feature-based, hook-driven

---

## Technical Architecture

### Core Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Frontend Framework** | React | 18 | UI library with hooks and functional components |
| **Type System** | TypeScript | Latest | Type safety and developer experience |
| **Build Tool** | Vite | Latest | Fast development and optimized builds |
| **Styling Framework** | Tailwind CSS | v4 | Utility-first CSS framework |
| **UI Components** | Ant Design (antd) | Latest | Pre-built, accessible components |
| **Data Grid** | ag-Grid React | Latest | Advanced table functionality |
| **HTTP Client** | Axios | Latest | Promise-based HTTP client |
| **Server State** | @tanstack/react-query | Latest | Server state management and caching |
| **Pattern Matching** | ts-pattern | Latest | Functional pattern matching |
| **Excel Operations** | ExcelJS | Latest | Excel import/export functionality |
| **API Mocking** | MSW | Latest | Mock Service Worker for testing |
| **Testing Framework** | Vitest | Latest | Fast unit testing framework |
| **Testing Framework** | React Testing Library | Latest | Fast react component testing framework |

### Architecture Principles

1. **Feature-Based Organization**: Code organized by business features, not technical layers
2. **Hook-Driven Development**: Business logic encapsulated in custom hooks
3. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
4. **Type-First Development**: TypeScript interfaces drive component and API design
5. **Composition Over Inheritance**: Favor composition patterns for reusability
6. **Single Responsibility**: Each component, hook, and service has one clear purpose

### Folder Structure

```
src/
├── app/                          # Application-level configuration
│   ├── store/                    # Global state management
│   ├── providers/                # Context providers and app setup
│   ├── router/                   # Application routing configuration
│   └── config/                   # App-wide configuration
├── features/                     # Feature-based modules
│   ├── auth/                     # Authentication feature
│   │   ├── components/           # Feature-specific components
│   │   │   ├── LoginForm/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── LoginForm.test.tsx
│   │   │   │   ├── LoginForm.stories.tsx
│   │   │   │   └── index.ts
│   │   │   └── RegisterForm/
│   │   ├── hooks/                # Business logic hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useAuth.test.ts
│   │   │   ├── useLogin.ts
│   │   │   └── useAuthValidation.ts
│   │   ├── services/             # Data access layer
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.service.test.ts
│   │   │   └── auth.api.ts
│   │   ├── store/                # Feature state management
│   │   │   ├── authReducer.ts
│   │   │   ├── authReducer.test.ts
│   │   │   └── authActions.ts
│   │   ├── types/                # Feature-specific types
│   │   │   ├── auth.types.ts
│   │   │   └── auth.constants.ts
│   │   ├── utils/                # Feature utilities
│   │   │   └── auth.utils.ts
│   │   └── index.ts              # Feature public API
│   └── dashboard/                # Dashboard feature
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       └── types/
├── shared/                       # Shared/common code
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Basic UI primitives
│   │   ├── forms/                # Form-related components
│   │   ├── layout/               # Layout components
│   │   └── data-display/         # Data visualization components
│   ├── hooks/                    # Reusable business logic
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── useApi.ts
│   ├── services/                 # Shared services
│   │   ├── api.service.ts
│   │   ├── storage.service.ts
│   │   └── notification.service.ts
│   ├── utils/                    # Utility functions
│   │   ├── format.utils.ts
│   │   ├── validation.utils.ts
│   │   └── date.utils.ts
│   ├── types/                    # Global type definitions
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   └── global.types.ts
│   └── constants/                # Application constants
│       ├── api.constants.ts
│       ├── app.constants.ts
│       └── validation.constants.ts
└── assets/                       # Static assets
    ├── images/
    ├── icons/
    └── styles/
```

---

## Development Standards

### Component Development Guidelines

#### Component Structure
```typescript
// Component Props Interface
interface UserProfileCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

// Component Implementation
export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onEdit,
  className,
  variant = 'default'
}) => {
  // Custom hooks for business logic
  const { isEditing, toggleEdit } = useEditMode();
  const { updateUser, isLoading } = useUserUpdate();
  
  // Event handlers
  const handleEdit = useCallback(() => {
    onEdit?.(user);
    toggleEdit();
  }, [user, onEdit, toggleEdit]);
  
  // Render logic
  return (
    <Card className={cn('user-profile-card', className)}>
      {/* Component JSX */}
    </Card>
  );
};
```

#### Custom Hook Pattern
```typescript
// Hook Interface
interface UseUserAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

// Hook Implementation
export const useUserAuth = (): UseUserAuthReturn => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { mutateAsync: loginMutation } = useLoginMutation();
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const user = await loginMutation(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
    }
  }, [loginMutation]);
  
  return {
    user: state.user,
    isAuthenticated: !!state.user,
    login,
    logout: () => dispatch({ type: 'LOGOUT' }),
    isLoading: state.isLoading,
    error: state.error
  };
};
```

### TypeScript Best Practices

#### Type Definitions
```typescript
// Base Types
type ID = string | number;
type Timestamp = string; // ISO 8601 format

// API Response Types
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: Timestamp;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Generic Component Props
interface BaseComponentProps {
  className?: string;
  testId?: string;
  children?: React.ReactNode;
}

// Form Types
interface FormFieldProps<T = any> extends BaseComponentProps {
  name: string;
  label?: string;
  value?: T;
  onChange?: (value: T) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```

#### State Management with useReducer
```typescript
// State Types
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Action Types using ts-pattern
type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Reducer with ts-pattern
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  return match(action)
    .with({ type: 'LOGIN_START' }, () => ({
      ...state,
      isLoading: true,
      error: null
    }))
    .with({ type: 'LOGIN_SUCCESS' }, ({ payload }) => ({
      ...state,
      user: payload,
      isAuthenticated: true,
      isLoading: false,
      error: null
    }))
    .with({ type: 'LOGIN_ERROR' }, ({ payload }) => ({
      ...state,
      isLoading: false,
      error: payload,
      isAuthenticated: false
    }))
    .with({ type: 'LOGOUT' }, () => ({
      ...initialState
    }))
    .with({ type: 'CLEAR_ERROR' }, () => ({
      ...state,
      error: null
    }))
    .exhaustive();
};
```

---

## Code Quality & Testing

### Testing Strategy

#### Component Testing
```typescript
// Component Test Example
describe('UserProfileCard', () => {
  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com'
  };

  it('should render user information correctly', () => {
    render(<UserProfileCard user={mockUser} />);
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const mockOnEdit = vi.fn();
    render(<UserProfileCard user={mockUser} onEdit={mockOnEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

#### Hook Testing
```typescript
// Hook Test Example
describe('useUserAuth', () => {
  it('should handle login successfully', async () => {
    const { result } = renderHook(() => useUserAuth());
    
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

### Code Quality Tools

#### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

### Performance Guidelines

1. **Memoization**: Use `useMemo` and `useCallback` for expensive computations
2. **Code Splitting**: Implement lazy loading for routes and heavy components
3. **Bundle Optimization**: Use Vite's built-in optimizations
4. **Image Optimization**: Implement proper image loading strategies
5. **Virtual Scrolling**: Use for large data sets in ag-Grid

---

## Styling & UI Guidelines

### Tailwind + Ant Design Integration

#### Component Styling Pattern
```typescript
// Combining Tailwind with Ant Design
const StyledCard: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <Card 
      className={cn(
        // Base Tailwind styles
        'rounded-lg shadow-sm border border-gray-200',
        // Responsive styles
        'p-4 md:p-6',
        // Dark mode support
        'dark:border-gray-700 dark:bg-gray-800',
        // Custom className
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};
```

#### Theme Configuration
```typescript
// Tailwind theme extension for Ant Design compatibility
const theme = {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        500: '#1890ff', // Ant Design primary
        600: '#096dd9',
        700: '#0050b3'
      }
    },
    spacing: {
      'antd-sm': '8px',
      'antd-md': '16px',
      'antd-lg': '24px'
    }
  }
};
```

### Responsive Design Standards

- **Laptop First**: Design for Laptop, enhance for desktop and mobile
- **Breakpoints**: Use Tailwind's standard breakpoints (sm, md, lg, xl, 2xl)
- **Touch Targets**: Minimum 44px for interactive elements
- **Typography**: Responsive font sizes using Tailwind's responsive utilities

### Accessibility Requirements

1. **Semantic HTML**: Use proper HTML elements and ARIA attributes
2. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
3. **Color Contrast**: Maintain WCAG AA compliance (4.5:1 ratio)
4. **Screen Reader Support**: Provide proper labels and descriptions
5. **Focus Management**: Implement proper focus indicators and management

---

## Data Management

### API Integration Patterns

#### Service Layer
```typescript
// API Service Example
class UserService {
  private api = axios.create({
    baseURL: '/api/users',
    timeout: 10000
  });

  async getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
    const response = await this.api.get<PaginatedResponse<User>>('/', { params });
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await this.api.post<ApiResponse<User>>('/', userData);
    return response.data;
  }

  async updateUser(id: ID, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response = await this.api.put<ApiResponse<User>>(`/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: ID): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/${id}`);
    return response.data;
  }
}

export const userService = new UserService();
```

#### React Query Integration
```typescript
// Query Hooks
export const useUsers = (params?: GetUsersParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};
```

### Error Handling Strategy

#### Global Error Handler
```typescript
// Error Types
interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Error Handler with ts-pattern
const handleApiError = (error: unknown): AppError => {
  return match(error)
    .with({ response: { status: 401 } }, () => ({
      code: 'UNAUTHORIZED',
      message: 'Please log in to continue',
      timestamp: new Date().toISOString()
    }))
    .with({ response: { status: 403 } }, () => ({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action',
      timestamp: new Date().toISOString()
    }))
    .with({ response: { status: 404 } }, () => ({
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      timestamp: new Date().toISOString()
    }))
    .otherwise(() => ({
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }));
};
```

---

## Naming Conventions

### File and Folder Naming
- **Folders**: kebab-case (`user-profile`, `order-management`)
- **Components**: PascalCase (`UserProfile.tsx`, `OrderSummary.tsx`)
- **Hooks**: camelCase with "use" prefix (`useAuth.ts`, `useUserProfile.ts`)
- **Services**: camelCase with ".service" suffix (`auth.service.ts`, `user.service.ts`)
- **Types**: camelCase with ".types" suffix (`auth.types.ts`, `user.types.ts`)
- **Tests**: Match file being tested with ".test" suffix (`UserProfile.test.tsx`)
- **Stories**: Match component with ".stories" suffix (`UserProfile.stories.tsx`)
- **API files**: camelCase with ".api" suffix (`auth.api.ts`, `user.api.ts`)
- **Utils**: camelCase with ".utils" suffix (`format.utils.ts`, `validation.utils.ts`)
- **Constants**: camelCase with ".constants" suffix (`api.constants.ts`)

### Code Naming Conventions
- **Components**: PascalCase (`UserProfileCard`, `OrderStatusBadge`)
- **Props Interfaces**: PascalCase with "Props" suffix (`UserProfileCardProps`)
- **Hook Names**: camelCase with "use" prefix (`useUserAuth`, `useOrderData`)
- **Hook Return Types**: PascalCase with "Return" suffix (`UseUserAuthReturn`)
- **Variables**: camelCase (`userData`, `isLoading`, `orderItems`)
- **Functions**: camelCase with verb-noun pattern (`getUserData`, `handleSubmit`)
- **Boolean Variables**: "is", "has", "can", "should" prefixes (`isVisible`, `hasPermission`)
- **Event Handlers**: "handle" prefix (`handleClick`, `handleSubmit`, `handleChange`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRY_ATTEMPTS`)
- **Enums**: PascalCase (`UserRole`, `OrderStatus`)
- **Enum Values**: SCREAMING_SNAKE_CASE (`USER_ROLE.ADMIN`, `ORDER_STATUS.PENDING`)

### API and Service Naming
- **Service Methods**: camelCase with action verbs (`getUsers`, `createOrder`, `updateUserProfile`)
- **API Endpoints**: camelCase (`getUserById`, `createNewOrder`)
- **Query Keys**: Array format with descriptive strings (`['users', 'list']`, `['orders', orderId]`)
- **Mutation Keys**: Descriptive strings (`'create-user'`, `'update-order'`)

### CSS and Styling
- **Custom CSS Classes**: kebab-case (`user-card`, `order-summary`)
- **BEM Methodology**: block__element--modifier (`card__title--highlighted`)
- **CSS Variables**: kebab-case with prefix (`--color-primary`, `--spacing-md`)
- **Tailwind Classes**: Follow Tailwind's utility-first approach

### Testing Conventions
- **Test Suites**: "describe" with component/function name (`describe('UserProfile', () => {})`)
- **Test Cases**: "it should" pattern (`it('should render user name correctly', () => {})`)
- **Test Variables**: Descriptive camelCase (`mockUserData`, `expectedResult`)
- **Mock Functions**: "mock" prefix (`mockGetUsers`, `mockHandleClick`)

---

## Development Workflow

### Environment Setup
1. **Node.js**: Version 18+ with npm or yarn
2. **VS Code Extensions**: 
   - TypeScript and JavaScript Language Features
   - Tailwind CSS IntelliSense
   - ES7+ React/Redux/React-Native snippets
   - Auto Rename Tag
   - Bracket Pair Colorizer
3. **Git Hooks**: Pre-commit hooks for linting and formatting

### Git Workflow
- **Branch Naming**: `feature/user-authentication`, `bugfix/login-error`, `hotfix/security-patch`
- **Commit Messages**: Conventional commits format (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`)
- **Pull Request Template**: Include description, testing steps, and checklist

### Code Review Guidelines
1. **Functionality**: Does the code work as expected?
2. **Type Safety**: Are all TypeScript types properly defined?
3. **Performance**: Are there any performance concerns?
4. **Accessibility**: Does the code meet accessibility standards?
5. **Testing**: Are there adequate tests for the changes?
6. **Documentation**: Is the code properly documented?

---

## Expected Output Format

When providing assistance, please include:

### Code Examples
- **Complete, working TypeScript code** with proper type definitions
- **Comprehensive error handling** using ts-pattern where appropriate
- **Proper component structure** following the established patterns
- **Test examples** for components and hooks
- **Accessibility considerations** in component implementation

### Documentation
- **Clear explanations** of design decisions and trade-offs
- **Performance considerations** and optimization strategies
- **Integration guidance** for Tailwind CSS and Ant Design
- **Type safety explanations** for complex TypeScript patterns

### Dependencies
- **Package.json entries** for any new dependencies
- **Version specifications** and compatibility notes
- **Installation and setup instructions**

### Best Practices
- **Code comments** explaining complex business logic
- **Responsive design implementation** using Tailwind classes
- **Adherence to naming conventions** specified in this document
- **Security considerations** for data handling and API integration

### Quality Assurance
- **Linting compliance** with project ESLint configuration
- **Type checking** with strict TypeScript settings
- **Test coverage** for critical functionality
- **Performance optimization** strategies and implementation

This comprehensive prompt ensures consistent, high-quality development practices across the entire TypeScript React project while maintaining scalability, maintainability, and developer experience.
