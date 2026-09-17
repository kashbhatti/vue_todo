export interface Task {
    id: number;
    name: string;
    is_complete: boolean;
    user_id: number;
    likes: number;
    user_liked: boolean;
}
