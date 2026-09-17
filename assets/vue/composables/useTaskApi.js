import { ref } from 'vue';
import axios from 'axios';

/** @typedef {import('../types/task.type').Task} Task */

export function useTaskApi() {
    const loading = ref(false);

    /** @returns {Promise<{ data: Task[]; error: string|null }>} */
    const getTasks = async () => {
        loading.value = true;

        try {
            const response = await axios.get('/api/task/all');

            return {
                data: response.data.data.tasks,
                error: null,
            };
        } catch (err) {
            return {
                data: [],
                error: err.response?.data?.message || 'Failed to load tasks',
            };
        } finally {
            loading.value = false;
        }
    };

    return { getTasks };
}
