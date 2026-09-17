import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Notification',
    template: `
        <div aria-live="assertive" class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6" style="z-index: 9999;">
            <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
                <div :class="['notification-panel pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10', { 'is-closing': closing }]">
                    <div class="p-4">
                        <div class="flex items-start">
                            <div class="shrink-0">
                                <svg v-if="status === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="size-6 text-green-400">
                                    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                                <svg v-else-if="status === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="size-6 text-red-400">
                                    <path d="M9.75 9.75 14.25 14.25M14.25 9.75 9.75 14.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </div>
                            <div class="ml-3 w-0 flex-1 pt-0.5">
                                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ message }}</p>
                            </div>
                            <div class="ml-4 flex shrink-0">
                                <button type="button" @click="dismiss" class="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:hover:text-white dark:focus:outline-indigo-500">
                                    <span class="sr-only">Close</span>
                                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
                                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    props: {
        status: { type: String, default: 'success' },
        message: { type: String, default: '' },
    },
    emits: ['close'],
    data() {
        return { closing: false, timer: null };
    },
    mounted() {
        this.timer = setTimeout(() => this.$emit('close'), 4500);
    },
    methods: {
        dismiss() {
            clearTimeout(this.timer);
            this.closing = true;
            setTimeout(() => this.$emit('close'), 250);
        },
    },
    beforeUnmount() {
        clearTimeout(this.timer);
    },
});
