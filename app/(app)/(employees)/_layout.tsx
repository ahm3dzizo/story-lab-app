import { Stack } from 'expo-router';
import { usePathname } from 'expo-router';

export default function EmployeesLayout() {
  const pathname = usePathname();
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: {
          backgroundColor: '#fff',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Employees',
          headerShown: pathname === '/employees',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Employee',
          presentation: 'modal',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Employee Profile',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Employee',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="attendance"
        options={{
          title: 'Attendance Management',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="leaves"
        options={{
          title: 'Leave Management',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="salary"
        options={{
          title: 'Salary Management',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="documents"
        options={{
          title: 'Documents',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="performance"
        options={{
          title: 'Performance Reviews',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="departments"
        options={{
          title: 'Departments',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="positions"
        options={{
          title: 'Positions',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 