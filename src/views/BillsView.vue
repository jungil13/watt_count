<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <BackButton />
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Bills</h1>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Search Bar -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by billing cycle (e.g., January 2024, December 2025)..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
        <!-- Desktop Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden hidden md:block">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing Cycle</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumption</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="bill in filteredBills" :key="bill.id" class="hover:bg-gray-50">
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ bill.full_name || bill.username }}</td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ bill.billing_cycle }}</td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div class="text-xs text-gray-500">{{ (bill.previous_reading || 0).toLocaleString() }} → {{ bill.current_reading.toLocaleString() }}</div>
                  <div class="font-medium">{{ bill.consumption_kwh.toLocaleString() }} kWh</div>
                </td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{{ bill.rate_per_kwh }}</td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱{{ bill.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{{ (bill.total_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800': bill.status === 'paid',
                      'bg-yellow-100 text-yellow-800': bill.status === 'partial',
                      'bg-red-100 text-red-800': bill.status === 'unpaid'
                    }"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ bill.status }}
                  </span>
                </td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    @click="viewBill(bill)"
                    class="text-blue-600 hover:text-blue-800 mr-3 text-xs sm:text-sm"
                  >
                    View
                  </button>
                  <button
                    v-if="bill.status !== 'paid' && isMainUser"
                    @click="showPaymentModal(bill)"
                    class="text-green-600 hover:text-green-800 text-xs sm:text-sm"
                  >
                    Pay
                  </button>
                  <button
                    v-if="isMainUser"
                    @click="deleteBill(bill.id)"
                    class="text-red-600 hover:text-red-800 text-xs sm:text-sm ml-2"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
              <tr v-if="filteredBills.length === 0">
                <td colspan="8" class="px-6 py-4 text-center text-sm text-gray-500">No bills found</td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4">
          <div v-for="bill in filteredBills" :key="bill.id" class="bg-white rounded-lg shadow p-4 space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-gray-900">{{ bill.full_name || bill.username }}</p>
                <p class="text-sm text-gray-500">{{ bill.billing_cycle }}</p>
              </div>
              <span
                :class="{
                  'bg-green-100 text-green-800': bill.status === 'paid',
                  'bg-yellow-100 text-yellow-800': bill.status === 'partial',
                  'bg-red-100 text-red-800': bill.status === 'unpaid'
                }"
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ bill.status }}
              </span>
            </div>
            
            <div class="bg-blue-50 rounded-lg p-3 space-y-1">
              <div class="text-xs text-gray-600">
                {{ bill.previous_reading || 0 }} → {{ bill.current_reading }} = {{ bill.consumption_kwh }} kWh
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Rate:</span>
                <span class="font-medium">₱{{ bill.rate_per_kwh }}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-1 border-t border-blue-200">
                <span>Total:</span>
                <span class="text-blue-700">₱{{ bill.total_amount.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between text-xs pt-1">
                <span class="text-gray-500">Paid:</span>
                <span>₱{{ (bill.total_paid || 0).toLocaleString() }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                @click="viewBill(bill)"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                View Details
              </button>
              <button
                v-if="bill.status !== 'paid' && isMainUser"
                @click="showPaymentModal(bill)"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Pay
              </button>
              <button
                v-if="isMainUser"
                @click="deleteBill(bill.id)"
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
          <div v-if="filteredBills.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-sm text-gray-500">
            No bills found
          </div>
        </div>
      </div>
    </main>

    <!-- Bill Details Modal -->
    <div v-if="selectedBill" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Bill Details</h2>
        
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">Billing Cycle</p>
            <p class="text-lg font-semibold">{{ selectedBill.billing_cycle }}</p>
          </div>

          <!-- Calculation Breakdown -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 class="font-bold text-gray-900 mb-4 text-base sm:text-lg">📊 Bill Calculation Breakdown</h3>
            <div class="space-y-3 text-sm">
              <div class="bg-white rounded-lg p-3 border border-blue-100">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-gray-600">Last Month Reading:</span>
                  <span class="font-bold text-gray-900">{{ (selectedBill.previous_reading || 0).toLocaleString() }} kWh</span>
                </div>
                <p class="text-xs text-gray-500">Previous month's meter reading</p>
              </div>
              <div class="bg-white rounded-lg p-3 border border-blue-100">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-gray-600">This Month Reading:</span>
                  <span class="font-bold text-gray-900">{{ selectedBill.current_reading.toLocaleString() }} kWh</span>
                </div>
                <p class="text-xs text-gray-500">Current month's meter reading</p>
              </div>
              <div class="bg-blue-100 rounded-lg p-3 border-2 border-blue-300">
                <div class="flex justify-between items-center">
                  <span class="text-gray-700 font-semibold">Consumption:</span>
                  <span class="font-bold text-blue-700 text-base">
                    {{ selectedBill.current_reading.toLocaleString() }} - {{ (selectedBill.previous_reading || 0).toLocaleString() }} = {{ selectedBill.consumption_kwh.toLocaleString() }} kWh
                  </span>
                </div>
              </div>
              <div class="bg-white rounded-lg p-3 border border-blue-100">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Rate per kWh:</span>
                  <span class="font-bold text-gray-900">₱{{ selectedBill.rate_per_kwh }}</span>
                </div>
              </div>
              <div class="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span class="text-gray-700 font-bold">Total Amount:</span>
                  <span class="text-xl sm:text-2xl font-bold text-green-700">
                    {{ selectedBill.consumption_kwh.toLocaleString() }} × ₱{{ selectedBill.rate_per_kwh }} = ₱{{ selectedBill.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p class="text-sm text-gray-500">Total Paid</p>
            <p class="text-lg">₱{{ (selectedBill.total_paid || 0).toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Remaining</p>
            <p class="text-lg font-semibold text-red-600">₱{{ (selectedBill.remaining_amount || selectedBill.total_amount).toLocaleString() }}</p>
          </div>

          <div v-if="selectedBill.payments && selectedBill.payments.length > 0" class="mt-6">
            <h3 class="font-semibold mb-2">Payment History</h3>
            <div class="space-y-2">
              <div v-for="payment in selectedBill.payments" :key="payment.id" class="border p-3 rounded">
                <p class="text-sm">Amount: ₱{{ payment.amount.toLocaleString() }}</p>
                <p class="text-sm text-gray-500">Date: {{ formatDate(payment.payment_date) }}</p>
                <p v-if="payment.reference_number" class="text-sm text-gray-500">Reference: {{ payment.reference_number }}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="selectedBill = null"
          class="mt-6 w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="paymentBill" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Record Payment</h2>
        
        <form @submit.prevent="savePayment" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              v-model.number="paymentData.amount"
              type="number"
              step="0.01"
              :max="paymentBill.remaining_amount || paymentBill.total_amount"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p class="text-xs text-gray-500 mt-1">Remaining: ₱{{ (paymentBill.remaining_amount || paymentBill.total_amount).toLocaleString() }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
            <input
              v-model="paymentData.payment_date"
              type="date"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select v-model="paymentData.payment_method" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
            <input
              v-model="paymentData.reference_number"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., GCash transaction ID"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              v-model="paymentData.notes"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="3"
            ></textarea>
          </div>

          <div class="flex gap-3">
            <button
              type="submit"
              class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Record Payment
            </button>
            <button
              type="button"
              @click="paymentBill = null"
              class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '../store/auth.js';
import { billService, paymentService } from '../services/localStorage.js';
import BackButton from '../components/BackButton.vue';
import notificationService from '../services/notifications.js';

const { isMainUser, user } = useAuth();

const loading = ref(true);
const bills = ref([]);
const selectedBill = ref(null);
const paymentBill = ref(null);
const searchQuery = ref('');

const paymentData = ref({
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: '',
  reference_number: '',
  notes: ''
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const filteredBills = computed(() => {
  if (!searchQuery.value) {
    return bills.value;
  }
  const query = searchQuery.value.toLowerCase();
  return bills.value.filter(bill => 
    bill.billing_cycle.toLowerCase().includes(query)
  );
});

const deleteBill = async (billId) => {
  if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
    return;
  }
  
  try {
    billService.delete(billId);
    loadBills();
    notificationService.notifySuccess('Bill deleted successfully');
  } catch (error) {
    alert(error.message || 'Error deleting bill');
    notificationService.notifyError(error.message || 'Error deleting bill');
  }
};

const loadBills = async () => {
  try {
    loading.value = true;
    if (isMainUser.value) {
      bills.value = billService.getAll(user.value.id);
    } else {
      bills.value = billService.getMy(user.value.id);
    }
  } catch (error) {
    console.error('Error loading bills:', error);
  } finally {
    loading.value = false;
  }
};

const viewBill = async (bill) => {
  try {
    const billDetails = billService.getById(bill.id);
    selectedBill.value = billDetails;
  } catch (error) {
    alert(error.message || 'Error loading bill details');
  }
};

const showPaymentModal = (bill) => {
  paymentBill.value = bill;
  paymentData.value = {
    amount: bill.remaining_amount || bill.total_amount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: '',
    notes: ''
  };
};

const savePayment = async () => {
  try {
    paymentService.create({
      bill_id: paymentBill.value.id,
      ...paymentData.value
    });
    paymentBill.value = null;
    loadBills();
    notificationService.notifyPaymentReceived(paymentData.value);
  } catch (error) {
    alert(error.message || 'Error recording payment');
    notificationService.notifyError(error.message || 'Error recording payment');
  }
};

onMounted(() => {
  loadBills();
});
</script>


