import { defineComponent } from 'vue';
import axios from 'axios';

export default defineComponent({
    name: 'Task',
    template: `<tr>
        <td>{{ id }}</td>
        <td>
            <div v-if="!is_editing" class="min-w-42">{{ localName }}</div>
            <div v-else>
                <input type="text" v-model="localName" required placeholder="Task name"
                    class="w-40 block rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
            </div>
        </td>
        <td>
            <div v-if="!is_editing">{{ localIsComplete ? 'Yes' : 'No' }}</div>
            <div v-else>
                <select v-model="localIsComplete"
                    class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-800 dark:focus-visible:outline-indigo-500">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                </select>
            </div>
        </td>
        <td>{{ localLikes }}</td>
        <td class="flex flex-row">
            <div v-if="!is_editing">
                <button type="button" @click="likeToggle(id)" :disabled="loading"
                    class="min-w-16 hover:cursor-pointer rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >{{ like_text_computed }}</button>
            </div>
            <div v-if="logged_in_user_id === user_id" class="flex flex-row">
                <button v-if="is_editing" type="button" @click="handleCancelEdit" :disabled="loading"
                    class="hover:cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >Cancel</button>
                <button type="button" @click="toggleSave(id)" :disabled="loading"
                    class="ml-4 hover:cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >{{ edit_text_computed }}</button>
                <button type="button" @click="handleDelete(id, index)" :disabled="loading"
                    class="ml-4 hover:cursor-pointer rounded-md bg-red-700 px-2.5 py-1.5 text-sm font-semibold shadow-xs inset-ring inset-ring-gray-300 hover:bg-red-600 text-white dark:shadow-none dark:inset-ring-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >Delete</button>
            </div>
        </td>
    </tr>`,
    emits: ['deleteTask', 'startEditing', 'notify', 'loading'],
    props: {
        id: {
            type: Number,
            default: 1,
            required: false,
        },
        name: {
            type: String,
            default: '',
            required: true,
        },
        index: {
            type: Number,
            default: 0,
            required: true,
        },
        is_complete: {
            type: Boolean,
            default: false,
            required: true,
        },
        user_id: {
            type: Number,
            default: 0,
            required: true,
        },
        likes: {
            type: Number,
            default: 0,
            required: true,
        },
        user_liked: {
            type: Boolean,
            default: false,
            required: true,
        },
        active_edit_id: {
            type: Number,
            default: null,
            required: false,
        },
        logged_in_user_id: {
            type: Number,
            default: null,
            required: false,
        },
    },
    data() {
        return {
            csrf: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            localName: this.name,
            localIsComplete: this.is_complete,
            localLikes: this.likes,
            localUserLiked: this.user_liked,
            loading: false,
        };
    },
    watch: {
        loading(val) {
            this.$emit('loading', val);
        },
    },
    computed: {
        is_editing() {
            return this.active_edit_id === this.id;
        },
        like_text_computed() {
            return this.localUserLiked ? 'Unlike' : 'Like';
        },
        edit_text_computed() {
            return this.is_editing ? 'Save' : 'Edit';
        },
    },
    methods: {
        async likeToggle(taskId) {
            this.loading = true;
            try {
                const response = await axios.post(`/api/task/${taskId}/like`, {}, {
                    headers: { 'X-CSRF-TOKEN': this.csrf },
                });
                this.localUserLiked = response.data.data.liked;
                this.localLikes = response.data.data.count;
                this.$emit('notify', { status: 'success', message: this.localUserLiked ? 'Task liked.' : 'Like removed.' });
            } catch (err) {
                console.error('Like toggle failed:', err.response?.status, err.response?.data);
                this.$emit('notify', { status: 'error', message: 'Failed to update like.' });
            } finally {
                this.loading = false;
            }
        },
        handleCancelEdit() {
            this.$emit('startEditing', null);
        },
        async toggleSave(taskId) {
            if (!this.is_editing) {
                this.$emit('startEditing', taskId);
                return;
            }

            this.loading = true;
            try {
                const response = await axios.post(`/api/task/${taskId}/edit`, {
                    name: this.localName,
                    is_complete: this.localIsComplete,
                }, {
                    headers: { 'X-CSRF-TOKEN': this.csrf },
                });
                this.localName = response.data.data.name;
                this.localIsComplete = response.data.data.is_complete;
                this.$emit('startEditing', null);
                this.$emit('notify', { status: 'success', message: 'Task saved.' });
            } catch (err) {
                console.error('Save failed:', err.response?.status, err.response?.data);
                this.$emit('notify', { status: 'error', message: 'Failed to save task.' });
            } finally {
                this.loading = false;
            }
        },
        async handleDelete(taskId, index) {
            if (!confirm('Are you sure you want to delete this task?')) return;

            this.$emit('startEditing', null);
            this.loading = true;
            try {
                await axios.post(`/api/task/${taskId}/delete`, {}, {
                    headers: { 'X-CSRF-TOKEN': this.csrf },
                });
                this.$emit('deleteTask', index);
                this.$emit('notify', { status: 'success', message: 'Task deleted.' });
            } catch (err) {
                console.error('Delete failed:', err.response?.status, err.response?.data);
                this.$emit('notify', { status: 'error', message: 'Failed to delete task.' });
            } finally {
                this.loading = false;
            }
        },
    },
});
