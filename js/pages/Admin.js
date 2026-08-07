import { fetchList } from "../content.js";

export default {
    template: `
        <main class="admin-page">
            <div class="admin-header">
                <div>
                    <h1>Demon List Manager</h1>
                    <p class="admin-subtitle">
                        Manage levels and placements
                    </p>
                </div>

                <button class="btn admin-add" @click="openAdd">
                    + Add Level
                </button>
            </div>

            <div class="admin-toolbar">
                <input
                    v-model="search"
                    type="text"
                    placeholder="Search levels..."
                    class="admin-search"
                />
            </div>

            <div v-if="loading" class="admin-message">
                Loading levels...
            </div>

            <div v-else-if="error" class="admin-message">
                Failed to load the Demon List.
            </div>

            <div v-else class="admin-table">
                <div class="admin-row admin-row-header">
                    <span>#</span>
                    <span>Level</span>
                    <span>Path</span>
                    <span>Actions</span>
                </div>

                <div
                    v-for="item in filteredLevels"
                    :key="item.path"
                    class="admin-row"
                >
                    <span class="admin-rank">
                        #{{ item.originalRank + 1 }}
                    </span>

                    <span class="admin-level">
                        {{ item.name }}
                    </span>

                    <span class="admin-path">
                        {{ item.path }}
                    </span>

                    <span class="admin-actions">
                        <button
                            class="btn-small"
                            @click="moveUp(item.originalRank)"
                            :disabled="item.originalRank === 0"
                        >
                            ↑
                        </button>

                        <button
                            class="btn-small"
                            @click="moveDown(item.originalRank)"
                            :disabled="item.originalRank === levels.length - 1"
                        >
                            ↓
                        </button>

                        <button
                            class="btn-small"
                            @click="openEdit(item)"
                        >
                            Edit
                        </button>

                        <button
                            class="btn-small btn-danger"
                            @click="removeLevel(item.originalRank)"
                        >
                            Remove
                        </button>
                    </span>
                </div>
            </div>

            <div v-if="showModal" class="admin-overlay">
                <div class="admin-modal">
                    <h2>
                        {{ editingIndex === null ? 'Add Level' : 'Edit Level' }}
                    </h2>

                    <label>
                        Level path
                        <input
                            v-model="form.path"
                            type="text"
                            placeholder="example-level"
                        />
                    </label>

                    <label>
                        Level name
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Example Level"
                        />
                    </label>

                    <div class="admin-modal-actions">
                        <button
                            class="btn-small"
                            @click="closeModal"
                        >
                            Cancel
                        </button>

                        <button
                            class="btn"
                            @click="saveLevel"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>

            <div class="admin-export">
                <h2>Export</h2>

                <p>
                    The current list can be exported as
                    <code>_list.json</code>.
                </p>

                <button class="btn" @click="exportList">
                    Download _list.json
                </button>
            </div>
        </main>
    `,

    data() {
        return {
            levels: [],
            search: "",
            loading: true,
            error: false,

            showModal: false,
            editingIndex: null,

            form: {
                path: "",
                name: "",
            },
        };
    },

    computed: {
        filteredLevels() {
            const query = this.search.toLowerCase().trim();

            return this.levels
                .map((level, index) => ({
                    ...level,
                    originalRank: index,
                }))
                .filter((level) => {
                    if (!query) return true;

                    return (
                        level.name.toLowerCase().includes(query) ||
                        level.path.toLowerCase().includes(query)
                    );
                });
        },
    },

    async mounted() {
        await this.loadLevels();
    },

    methods: {
        async loadLevels() {
            this.loading = true;
            this.error = false;

            try {
                const result = await fetchList();

                if (!result) {
                    throw new Error("Failed to fetch list");
                }

                this.levels = result
                    .map(([level, error], index) => {
                        if (error || !level) {
                            return {
                                name: error || "Unknown Level",
                                path: error || "",
                            };
                        }

                        return {
                            name: level.name,
                            path: level.path,
                        };
                    });
            } catch (error) {
                console.error(error);
                this.error = true;
            }

            this.loading = false;
        },

        openAdd() {
            this.editingIndex = null;

            this.form = {
                path: "",
                name: "",
            };

            this.showModal = true;
        },

        openEdit(item) {
            this.editingIndex = item.originalRank;

            this.form = {
                path: item.path,
                name: item.name,
            };

            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.editingIndex = null;
        },

        saveLevel() {
            const path = this.form.path.trim();
            const name = this.form.name.trim();

            if (!path || !name) {
                alert("Please enter both a level path and level name.");
                return;
            }

            if (this.editingIndex === null) {
                this.levels.push({
                    path,
                    name,
                });
            } else {
                this.levels[this.editingIndex] = {
                    path,
                    name,
                };
            }

            this.closeModal();
        },

        removeLevel(index) {
            const level = this.levels[index];

            if (!level) return;

            const confirmed = confirm(
                `Remove "${level.name}" from the Demon List?`
            );

            if (!confirmed) return;

            this.levels.splice(index, 1);
        },

        moveUp(index) {
            if (index <= 0) return;

            const temp = this.levels[index - 1];

            this.levels[index - 1] = this.levels[index];
            this.levels[index] = temp;
        },

        moveDown(index) {
            if (index >= this.levels.length - 1) return;

            const temp = this.levels[index + 1];

            this.levels[index + 1] = this.levels[index];
            this.levels[index] = temp;
        },

        exportList() {
            const data = this.levels.map((level) => level.path);

            const blob = new Blob(
                [JSON.stringify(data, null, 4)],
                {
                    type: "application/json",
                }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = "_list.json";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        },
    },
};