// Stubs for Customers (Migration to MySQL pending)

export async function createCustomer(data: any) {
  console.log('createCustomer stub called', data);
  return 'mock-customer-id';
}

export async function getCustomers() {
  return [];
}

export async function getCustomer(id: string) {
  return null;
}

export async function getCustomerByEmail(email: string) {
  return null;
}

export async function updateCustomer(id: string, data: any) {
  console.log('updateCustomer stub called', id, data);
}

export async function deleteCustomer(id: string) {
  console.log('deleteCustomer stub called', id);
}

export async function createCustomerGroup(data: any) { return 'mock-group-id'; }
export async function getCustomerGroups() { return []; }
export async function getCustomerGroup(id: string) { return null; }
export async function updateCustomerGroup() { }
export async function deleteCustomerGroup() { }

export async function addCustomerAddress() { return 'mock-addr-id'; }
export async function getCustomerAddresses() { return []; }
export async function updateCustomerAddress() { }
export async function deleteCustomerAddress() { }

export async function addCustomerNote() { return 'mock-note-id'; }
export async function getCustomerNotes() { return []; }
export async function deleteCustomerNote() { }

export async function addCustomerTag() { }
export async function removeCustomerTag() { }
