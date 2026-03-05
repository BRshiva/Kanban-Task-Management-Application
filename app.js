const { createApp, ref, computed, watch, onMounted } = Vue;

const App = {
  setup() {
    // 1. Core State
    const tasks = ref([]);
    const searchQuery = ref('');
    const isDarkMode = ref(true);
    
    // Drag & Drop State
    const draggingId = ref(null);
    const dragOverCol = ref(null);

    // Modal State
    const modal = ref(null);
    const modalForm = ref({ title: '', desc: '', priority: 'medium', col: 'todo', id: null });

    const columns = [
      { id: 'todo', label: 'Todo', color: '#4d79ff', bg: 'col-todo' },
      { id: 'inprogress', label: 'In Progress', color: '#c855f7', bg: 'col-inprogress' },
      { id: 'done', label: 'Done', color: '#43e97b', bg: 'col-done' },
    ];

    // 2. Lifecycle & Persistence (Local Storage)
    onMounted(() => {
      // Changed storage key to generic app name
      const stored = localStorage.getItem('gdg_kanban_data');
      if (stored) tasks.value = JSON.parse(stored);
      document.body.classList.toggle('light', !isDarkMode.value);
    });

    watch(tasks, (newVal) => {
      localStorage.setItem('gdg_kanban_data', JSON.stringify(newVal));
    }, { deep: true });

    // 3. Computed Properties (Filtering & Progress)
    const filteredTasks = computed(() => {
      const query = searchQuery.value.toLowerCase();
      return tasks.value.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.desc.toLowerCase().includes(query)
      );
    });

    const getTasksByCol = (colId) => {
      return filteredTasks.value.filter(t => t.col === colId);
    };

    const progressPct = computed(() => {
      if (tasks.value.length === 0) return 0;
      const doneCount = tasks.value.filter(t => t.col === 'done').length;
      return Math.round((doneCount / tasks.value.length) * 100);
    });

    // 4. Methods
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value;
      document.body.classList.toggle('light', !isDarkMode.value);
    };

    const generateId = () => Math.random().toString(36).slice(2, 10);
    const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Modal Operations
    const openNewModal = (colId) => {
      modalForm.value = { title: '', desc: '', priority: 'medium', col: colId, id: null };
      modal.value = { mode: 'new' };
    };

    const openEditModal = (task) => {
      modalForm.value = { ...task };
      modal.value = { mode: 'edit' };
    };

    const closeModal = () => {
      modal.value = null;
    };

    const saveTask = () => {
      if (!modalForm.value.title.trim()) return;
      
      if (modal.value.mode === 'edit') {
        const index = tasks.value.findIndex(t => t.id === modalForm.value.id);
        if (index !== -1) tasks.value[index] = { ...modalForm.value };
      } else {
        tasks.value.push({
          ...modalForm.value,
          id: generateId(),
          createdAt: Date.now()
        });
      }
      closeModal();
    };

    const deleteTask = (id) => {
      if (window.confirm('Are you sure you want to remove this task?')) {
        tasks.value = tasks.value.filter(t => t.id !== id);
      }
    };

    // Drag and Drop Logic
    const handleDragStart = (e, id) => {
      e.dataTransfer.setData('text/plain', id);
      draggingId.value = id;
    };

    const handleDragEnd = () => {
      draggingId.value = null;
      dragOverCol.value = null;
    };

    const handleDrop = (colId) => {
      if (!draggingId.value) return;
      const task = tasks.value.find(t => t.id === draggingId.value);
      if (task) task.col = colId;
      handleDragEnd();
    };

    return {
      tasks, searchQuery, isDarkMode, modal, modalForm, columns, dragOverCol,
      progressPct, getTasksByCol, toggleTheme, openNewModal, openEditModal,
      closeModal, saveTask, deleteTask, handleDragStart, handleDragEnd, handleDrop,
      formatDate
    };
  }
};

createApp(App).mount('#app');