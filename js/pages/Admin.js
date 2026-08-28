const WORKER_URL = "https://ggdl-admin-worker.jontereze.workers.dev";

const EMPTY_LEVEL = () => ({
    id: "",
    name: "",
    author: "",
    creators: [],
    verifier: "",
    verification: "",
    percentToQualify: 100,
    password: "",
    records: [],
});

const clone = (value) => JSON.parse(JSON.stringify(value));

export default {
    template: `
        <main class="admin-page">
            <div class="admin-header">
                <div>
                    <h1>Demon List Manager</h1>
                    <p class="admin-subtitle">
                        Manage levels, placements, and records
                    </p>
                </div>

                <div class="admin-header-actions">
                    <button class="btn" @click="openAdd">
                        + Add Level
                    </button>

                    <button
                        class="btn"
                        @click="saveListChanges"
                        :disabled="!hasChanges"
                    >
                        Save List Changes
                    </button>

                    <button class="btn" @click="exportList">
                        Export List
                    </button>

                    <button class="btn" @click="exportAll">
                        Export All Data
                    </button>
                </div>
            </div>

            <div class="admin-toolbar">
                <input
                    v-model="search"
                    type="text"
                    placeholder="Search by name, path, author, verifier..."
                    class="admin-search"
                />
            </div>

            <div v-if="loading" class="admin-message">
                Loading levels...
            </div>

            <div v-else-if="error" class="admin-message">
                Failed to load the Demon List.
            </div>

            <template v-else>
                <div class="admin-summary">
                    <span>{{ levels.length }} levels</span>
                    <span v-if="hasChanges" class="admin-unsaved">
                        Unsaved changes
                    </span>
                </div>

                <div v-if="filteredLevels.length" class="admin-table">
                    <div class="admin-row admin-row-header">
                        <span>#</span>
                        <span>Level</span>
                        <span>Details</span>
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
                            <strong>{{ item.name }}</strong>
                            <small>{{ item.path }}</small>
                        </span>

                        <span class="admin-details">
                            <span>
                                ID: {{ item.id || "—" }}
                            </span>

                            <span>
                                Author: {{ item.author || "—" }}
                            </span>

                            <span>
                                Records: {{ item.records?.length || 0 }}
                            </span>
                        </span>

                        <span class="admin-actions">
                            <button
                                class="btn-small"
                                @click="moveUp(item.originalRank)"
                                :disabled="item.originalRank === 0"
                                title="Move up"
                            >
                                ↑
                            </button>

                            <button
                                class="btn-small"
                                @click="moveDown(item.originalRank)"
                                :disabled="item.originalRank === levels.length - 1"
                                title="Move down"
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
                                class="btn-small"
                                @click="exportLevel(item)"
                            >
                                JSON
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

                <div v-else class="admin-message">
                    No levels match "{{ search }}".
                </div>
            </template>

            <div v-if="showModal" class="admin-overlay">
                <div class="admin-modal admin-editor">
                    <div class="admin-modal-header">
                        <div>
                            <h2>
                                {{ editingIndex === null
                                    ? 'Add Level'
                                    : 'Edit Level' }}
                            </h2>

                            <p>
                                Edit the level metadata and records.
                            </p>
                        </div>

                        <button
                            class="btn-small"
                            @click="closeModal"
                            title="Close"
                        >
                            ×
                        </button>
                    </div>

                    <div class="admin-form-grid">
                        <label>
                            File path
                            <input
                                v-model="form.path"
                                type="text"
                                placeholder="example-level"
                            />
                            <small>
                                The JSON filename without .json
                            </small>
                        </label>

                        <label>
                            Level ID
                            <input
                                v-model="form.id"
                                type="number"
                                placeholder="12345678"
                            />
                        </label>

                        <label class="admin-field-wide">
                            Level name
                            <input
                                v-model="form.name"
                                type="text"
                                placeholder="Example Level"
                            />
                        </label>

                        <label>
                            Author
                            <input
                                v-model="form.author"
                                type="text"
                                placeholder="Author"
                            />
                        </label>

                        <label>
                            Verifier
                            <input
                                v-model="form.verifier"
                                type="text"
                                placeholder="Verifier"
                            />
                        </label>

                        <label class="admin-field-wide">
                            Creators
                            <input
                                v-model="creatorsText"
                                type="text"
                                placeholder="Creator 1, Creator 2"
                            />
                            <small>
                                Separate multiple creators with commas.
                            </small>
                        </label>

                        <label class="admin-field-wide">
                            Verification video
                            <input
                                v-model="form.verification"
                                type="url"
                                placeholder="https://www.youtube.com/..."
                            />
                        </label>

                        <label>
                            Percent to qualify
                            <input
                                v-model.number="form.percentToQualify"
                                type="number"
                                min="0"
                                max="100"
                            />
                        </label>

                        <label>
                            Password
                            <input
                                v-model="form.password"
                                type="text"
                                placeholder="040400"
                            />
                        </label>
                    </div>

                    <div class="admin-records">
                        <div class="admin-section-header">
                            <div>
                                <h3>Records</h3>
                                <p>
                                    {{ form.records.length }} record(s)
                                </p>
                            </div>

                            <button
                                class="btn-small"
                                @click="addRecord"
                            >
                                + Add Record
                            </button>
                        </div>

                        <div
                            v-if="form.records.length"
                            class="admin-record-list"
                        >
                            <div
                                v-for="(record, index) in form.records"
                                :key="index"
                                class="admin-record"
                            >
                                <div class="admin-record-fields">
                                    <label>
                                        User
                                        <input
                                            v-model="record.user"
                                            type="text"
                                        />
                                    </label>

                                    <label>
                                        Percent
                                        <input
                                            v-model.number="record.percent"
                                            type="number"
                                            min="0"
                                            max="100"
                                        />
                                    </label>

                                    <label>
                                        Hz
                                        <input
                                            v-model.number="record.hz"
                                            type="number"
                                            min="1"
                                        />
                                    </label>

                                    <label>
                                        Link
                                        <input
                                            v-model="record.link"
                                            type="url"
                                            placeholder="https://..."
                                        />
                                    </label>

                                    <label class="admin-checkbox">
                                        <input
                                            v-model="record.mobile"
                                            type="checkbox"
                                        />
                                        Mobile
                                    </label>
                                </div>

                                <button
                                    class="btn-small btn-danger"
                                    @click="removeRecord(index)"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        <div v-else class="admin-empty">
                            No records yet.
                        </div>
                    </div>

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
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            <div class="admin-export">
                <h2>Export</h2>

                <p>
                    Export the modified files and replace the corresponding
                    files inside <code>data/</code> in your repository.
                </p>

                <div class="admin-export-actions">
                    <button class="btn" @click="exportList">
                        Download _list.json
                    </button>

                    <button class="btn" @click="exportAll">
                        Download all level JSON files
                    </button>
                </div>
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

            hasChanges: false,

            form: EMPTY_LEVEL(),
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

                    const creators = Array.isArray(level.creators)
                        ? level.creators.join(" ")
                        : "";

                    return [
                        level.name,
                        level.path,
                        level.author,
                        level.verifier,
                        creators,
                        String(level.id || ""),
                    ]
                        .join(" ")
                        .toLowerCase()
                        .includes(query);
                });
        },

        creatorsText: {
            get() {
                return Array.isArray(this.form.creators)
                    ? this.form.creators.join(", ")
                    : "";
            },

            set(value) {
                this.form.creators = value
                    .split(",")
                    .map((creator) => creator.trim())
                    .filter(Boolean);
            },
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
                const response = await fetch(
                    `${WORKER_URL}/get-list`
                );

                const result = await response.json();

                if (!response.ok || !result.ok) {
                    throw new Error(
                        result.error || "Failed to load list"
                    );
                }

                this.levels = result.levels.map(
                    (path) => ({
                        ...EMPTY_LEVEL(),
                        path: path.replace(/^data\//, "")
                            .replace(/\.json$/, ""),
                        fullPath: path,
                        name: path,
                        loadingDetails: true,
                    })
                );

                await Promise.all(
                    this.levels.map(async (level, index) => {
                        const response = await fetch(
                            `${WORKER_URL}/get-level?path=${encodeURIComponent(
                                level.fullPath
                            )}`
                        );

                        const result = await response.json();

                        if (!response.ok || !result.ok) {
                            throw new Error(
                                result.error ||
                                `Failed to load ${level.fullPath}`
                            );
                        }

                        this.levels[index] = {
                            ...EMPTY_LEVEL(),
                            ...clone(result.level),
                            path: result.file
                                .replace(/^data\//, "")
                                .replace(/\.json$/, ""),
                            fullPath: result.file,
                            records: Array.isArray(
                                result.level.records
                            )
                                ? clone(result.level.records)
                                : [],
                            creators: Array.isArray(
                                result.level.creators
                            )
                                ? [...result.level.creators]
                                : [],
                            loadingDetails: false,
                        };
                    })
                );

                this.hasChanges = false;
            } catch (error) {
                console.error(error);
                this.error = true;
            }

            this.loading = false;
        },

        openAdd() {
            this.editingIndex = null;
            this.form = EMPTY_LEVEL();
            this.showModal = true;
        },

        openEdit(item) {
            this.editingIndex = item.originalRank;

            this.form = {
                ...EMPTY_LEVEL(),
                ...clone(this.levels[item.originalRank]),
                records: Array.isArray(item.records)
                    ? clone(item.records)
                    : [],
                creators: Array.isArray(item.creators)
                    ? [...item.creators]
                    : [],
            };

            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.editingIndex = null;
        },

        async saveLevel() {
            const path = this.form.path.trim();
            const name = this.form.name.trim();

            if (!path || !name) {
                alert(
                    "Please enter both a level path and level name."
                );
                return;
            }

            if (!/^[a-zA-Z0-9_\-]+$/.test(path)) {
                alert(
                    "Level path may only contain letters, numbers, underscores, and hyphens."
                );
                return;
            }

            if (
                this.form.percentToQualify < 0 ||
                this.form.percentToQualify > 100
            ) {
                alert(
                    "Percent to qualify must be between 0 and 100."
                );
                return;
            }

            const duplicateIndex = this.levels.findIndex(
                (level, index) =>
                    level.path.toLowerCase() ===
                        path.toLowerCase() &&
                    index !== this.editingIndex
            );

            if (duplicateIndex !== -1) {
                alert(
                    `A level with the path "${path}" already exists.`
                );
                return;
            }

            const levelData = {
                id: this.form.id === ""
                    ? ""
                    : Number(this.form.id),

                name,

                author: String(
                    this.form.author || ""
                ).trim(),

                creators: Array.isArray(this.form.creators)
                    ? this.form.creators
                        .map((creator) => creator.trim())
                        .filter(Boolean)
                    : [],

                verifier: String(
                    this.form.verifier || ""
                ).trim(),

                verification: String(
                    this.form.verification || ""
                ).trim(),

                percentToQualify:
                    Number(this.form.percentToQualify) || 0,

                password: String(
                    this.form.password || ""
                ).trim(),

                records: this.form.records.map(
                    (record) => ({
                        user: String(
                            record.user || ""
                        ).trim(),

                        link: String(
                            record.link || ""
                        ).trim(),

                        percent:
                            Number(record.percent) || 0,

                        hz:
                            Number(record.hz) || 0,

                        ...(record.mobile
                            ? { mobile: true }
                            : {}),
                    })
                ),
            };

            const githubPath =
                `data/${path}.json`;

            try {
                const response = await fetch(
                    `${WORKER_URL}/update-level`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            path: githubPath,
                            level: levelData,
                        }),
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.ok) {
                    throw new Error(
                        result.error ||
                        result.githubResponse ||
                        "Failed to update level."
                    );
                }

                const updatedLevel = {
                    ...levelData,
                    path,
                    fullPath: githubPath,
                };

                if (this.editingIndex === null) {
                    this.levels.push(updatedLevel);
                } else {
                    this.levels[this.editingIndex] =
                        updatedLevel;
                }

                this.hasChanges = false;

                this.closeModal();

                alert(
                    `"${name}" was successfully saved to GitHub!`
                );
            } catch (error) {
                console.error(error);

                alert(
                    `Failed to save level: ${error.message}`
                );
            }
        },

        addRecord() {
            this.form.records.push({
                user: "",
                link: "",
                percent: 100,
                hz: 360,
            });
        },

        removeRecord(index) {
            if (
                !confirm(
                    `Remove record #${index + 1}?`
                )
            ) {
                return;
            }

            this.form.records.splice(index, 1);
        },

        removeLevel(index) {
            const level = this.levels[index];

            if (!level) return;

            if (
                !confirm(
                    `Remove "${level.name}" from the Demon List?`
                )
            ) {
                return;
            }

            this.levels.splice(index, 1);
            this.hasChanges = true;
        },

        async saveListChanges() {
            if (!this.hasChanges) {
                return;
            }

            const levels = this.levels.map((level) =>
                level.fullPath ||
                `data/${level.path}.json`
            );

            try {
                const response = await fetch(
                    `${WORKER_URL}/update-list`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                        },

                        body: JSON.stringify({
                            levels,
                        }),
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.ok) {
                 throw new Error(
                        result.error ||
                        result.githubResponse ||
                        "Failed to save list changes."
                    );
                }

                this.hasChanges = false;

                alert(
                    "Demon List order successfully saved to GitHub!"
                );
            } catch (error) {
                console.error(error);

             alert(
                    `Failed to save list changes: ${error.message}`
                );
            }
        },

        moveUp(index) {
            if (index <= 0) return;

            const temp = this.levels[index - 1];

            this.levels[index - 1] = this.levels[index];
            this.levels[index] = temp;

            this.hasChanges = true;
        },

        moveDown(index) {
            if (index >= this.levels.length - 1) return;

            const temp = this.levels[index + 1];

            this.levels[index + 1] = this.levels[index];
            this.levels[index] = temp;

            this.hasChanges = true;
        },

        getLevelData(level) {
            return {
                id: level.id,
                name: level.name,
                author: level.author,
                creators: level.creators,
                verifier: level.verifier,
                verification: level.verification,
                percentToQualify: level.percentToQualify,
                password: level.password,
                records: level.records,
            };
        },

        downloadJson(filename, data) {
            const blob = new Blob(
                [JSON.stringify(data, null, 4)],
                {
                    type: "application/json",
                }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        },

        exportList() {
            const data = this.levels.map(
                (level) => level.path
            );

            this.downloadJson("_list.json", data);
        },

        exportLevel(level) {
            this.downloadJson(
                `${level.path}.json`,
                this.getLevelData(level)
            );
        },

        async exportAll() {
            /*
             * Browsers cannot create a directory of downloaded files
             * without additional APIs/libraries.
             *
             * Download the list first, then each level JSON.
             */
            this.exportList();

            for (const level of this.levels) {
                this.exportLevel(level);

                await new Promise((resolve) =>
                    setTimeout(resolve, 100)
                );
            }
        },
    },
};