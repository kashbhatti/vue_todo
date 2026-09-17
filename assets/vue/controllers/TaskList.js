import {defineComponent} from 'vue';
import Task from '../components/Task.js';
import Notification from '../components/Notification.js';
import _ from "lodash";
import axios from "axios";
import {useTaskApi} from '../composables/useTaskApi.js';

export default defineComponent({
    setup() {
        const { getTasks } = useTaskApi();
        return { getTasks };
    },
    name: 'TaskList',
    template: `<div>
        <notification
            v-for="n in notifications"
            :key="n.id"
            :status="n.status"
            :message="n.message"
            @close="closeNotification(n.id)"
        />
        <form @submit.prevent="saveNew" class="flex flex-row mb-4">
            <input type="text" name="task_new_name" id="task_new_name" v-model="taskName"
                           class="block w-40 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                           placeholder="Task name" required />
            <button type="submit"
                    class="ml-4 min-w-20 hover:cursor-pointer rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >Add Task</button>
        </form>
        <div>
            <input type="text" name="search" id="search"
               class="block w-40 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
               placeholder="Search Tasks" @input="debounceInput" />
        </div>
        <div v-if="loading">
            <span class="mt-4 inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-alpine-devtools-right-click=""></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            </span>
        </div>
        <div v-if="!loading" class="mt-4 h-6 mb-4"></div>
        <table class="table table--type-task">
            <thead>
            <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Is complete</th>
                <th>Likes</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            <task
                v-for="(task, index) in filteredTasks"
                :key="task.id"
                :index="index"
                :name="task.name"
                :id="task.id"
                :likes="task.likes"
                :user_liked="task.user_liked"
                :is_complete="task.is_complete"
                :user_id="task.user_id"
                :active_edit_id="editingTaskId"
                :logged_in_user_id="user_id"
                v-on:deleteTask="deleteTask"
                v-on:startEditing="setEditing"
                v-on:notify="showNotification"
                v-on:loading="loading = $event"
            >
            </task>
            <tr v-if="!filteredTasks.length">
                <td colspan="5">
                    no records found
                </td>
            </tr>
            </tbody>
        </table>
    </div>`,
    props: {
        user_id: {
            type: Number,
            default: 1,
            required: false,
        },
    },
    data() {
        return {
            csrf: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            tasks: [],
            query: '',
            editingTaskId: null,
            taskName: '',
            notifications: [],
            loading: true,
        }
    },
    computed: {
        filteredTasks() {
            return this.tasks.filter((task) => {
                return task.name.toLowerCase().includes(this.query.toLowerCase());
            })
        }
    },
    async mounted() {
        await this.fetchTasks();
    },
    components: {
        Task,
        Notification,
    },
    methods: {
        async fetchTasks() {
            try {
                const result = await this.getTasks();
                if (result.error) {
                    this.showNotification({ status: 'error', message: result.error });
                    return;
                }
                this.tasks = result.data;
            } finally {
                this.loading = false;
            }
        },
        debounceInput: _.debounce(function (e) {
            this.query = e.target.value;
        }, 500),
        setEditing(taskId) {
            this.editingTaskId = taskId;
        },
        deleteTask(index) {
            this.tasks.splice(index, 1);
        },
        showNotification({ status, message }) {
            this.notifications.push({ id: Date.now(), status, message });
        },
        closeNotification(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        },
        async saveNew() {
            if (this.taskName.length < 3) {
                this.showNotification({ status: 'error', message: 'Task name must be at least 3 characters long.' });
                return;
            }

            this.loading = true;
            try {
                const response = await axios.post('/api/task/new', { name: this.taskName }, {
                    headers: { 'X-CSRF-TOKEN': this.csrf },
                });
                const raw = response.data.data;
                /** @type {import('../types/task.type').Task} */
                const newTask = {
                    id: raw.id,
                    name: raw.name,
                    is_complete: raw.is_complete,
                    user_id: raw.user_id,
                    likes: raw.likes ?? 0,
                    user_liked: raw.user_liked ?? false,
                };
                this.tasks.push(newTask);
                this.taskName = '';
                this.showNotification({ status: 'success', message: 'Task created.' });
            } catch (err) {
                console.error('Create task failed:', err.response?.status, err.response?.data);
                this.showNotification({ status: 'error', message: 'Failed to create task.' });
            } finally {
                this.loading = false;
            }
        },
    }
});
