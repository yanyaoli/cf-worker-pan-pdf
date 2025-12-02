/**
 * BaiduDisk Fxxker - Cloudflare Worker Backend
 * Refactored from Python to JS for Serverless deployment
 */

const DEFAULT_UA = "netdisk";
const PDF_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0";

// --- Configuration ---
// Serve-side Default Cookies (Array of strings)
const SERVER_DEFAULT_COOKIES = []; 

// --- HTML Content ---
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BaiduDisk Fxxker</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20640%20640%22%3E%3Cpath%20fill%3D%22rgb(50%2C120%2C200)%22%20d%3D%22M64%20288C64%20341%20107%20384%20160%20384L198.6%20384L322.7%20273C334.9%20262.1%20350.7%20256%20367.1%20256C411.7%20256%20443.6%20299%20430.8%20341.7L418.1%20384L480%20384C533%20384%20576%20341%20576%20288C576%20235%20533%20192%20480%20192C479.5%20192%20478.9%20192%20478.4%20192C479.5%20186.8%20480%20181.5%20480%20176C480%20131.8%20444.2%2096%20400%2096C375.7%2096%20353.9%20106.9%20339.2%20124C320.5%2088.3%20283.1%2064%20240%2064C178.1%2064%20128%20114.1%20128%20176C128%20183.1%20128.7%20190.1%20129.9%20196.8C91.6%20209.4%2064%20245.5%2064%20288zM224.6%20464L286.4%20464L255.2%20568.1C251.6%20580%20260.5%20592%20273%20592C277.6%20592%20282%20590.3%20285.4%20587.3L426.5%20460.9C430%20457.8%20432%20453.3%20432%20448.5C432%20439.3%20424.6%20431.9%20415.4%20431.9L353.6%20431.9L384.8%20327.8C388.4%20315.9%20379.5%20303.9%20367%20303.9C362.4%20303.9%20358%20305.6%20354.6%20308.6L213.5%20435.1C210%20438.2%20208%20442.7%20208%20447.5C208%20456.7%20215.4%20464.1%20224.6%20464.1z%22%2F%3E%3C%2Fsvg%3E">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
        .fade-enter-from, .fade-leave-to { opacity: 0; }
        .list-enter-active, .list-leave-active { transition: all 0.4s ease; }
        .list-enter-from, .list-leave-to { opacity: 0; transform: translateY(10px); }
        .modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
        .modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    </style>
</head>
<body class="bg-gray-50 text-slate-800 min-h-screen">
    <div id="app" class="max-w-6xl mx-auto px-4 py-8">
        
        <!-- Header -->
        <header class="flex items-center justify-between mb-8 select-none">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200">
                    <i class="fa-solid fa-cloud-bolt"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-slate-900 tracking-tight">BaiduDisk Fxxker</h1>
                    <p class="text-sm text-slate-500 font-medium">PDF小文件预览服务</p>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <transition name="fade">
                    <button v-if="resultLinks.length > 0" @click="showResultModal = true" class="w-10 h-10 rounded-full bg-white border border-slate-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-center shadow-sm" title="查看结果">
                        <i class="fa-solid fa-list-check"></i>
                    </button>
                </transition>
                <button @click="showSettingsModal = true" class="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center shadow-sm" title="设置 Cookie">
                    <i class="fa-solid fa-user-gear"></i>
                </button>
            </div>
        </header>

        <!-- Input Area -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 transition-all focus-within:ring-2 ring-indigo-100 ring-offset-2">
            <label class="block text-sm font-semibold text-slate-700 mb-2">资源分享链接</label>
            <div class="flex flex-col md:flex-row gap-3">
                <div class="relative flex-1">
                    <input type="text" v-model="link" @keyup.enter="analyzeLink"
                        placeholder="粘贴链接，例如: https://pan.baidu.com/s/1xxxxxx?pwd=xxxx" 
                        class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-slate-700 font-mono text-sm">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <i class="fa-solid fa-link"></i>
                    </div>
                </div>
                <button @click="analyzeLink" :disabled="loading" 
                    class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]">
                    <i v-if="loading" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
                    {{ loading ? '解析中...' : '开始解析' }}
                </button>
            </div>
            <transition name="fade">
                <div v-if="errorMsg" class="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-3 border border-red-100">
                    <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
                    <span>{{ errorMsg }}</span>
                </div>
            </transition>
        </div>

        <!-- File List -->
        <transition name="list">
            <div v-if="hasData" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                
                <!-- Toolbar -->
                <div class="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <div class="flex items-center text-sm text-slate-600 overflow-x-auto w-full md:w-auto scrollbar-hide pb-2 md:pb-0">
                        <button @click="resetToRoot" class="hover:text-indigo-600 font-bold flex items-center gap-1 transition-colors px-1 rounded hover:bg-slate-200/50 whitespace-nowrap">
                            <i class="fa-solid fa-house"></i> 根目录
                        </button>
                        <template v-for="(folder, index) in currentPath" :key="index">
                            <span class="text-slate-300 mx-1">/</span>
                            <span class="font-medium max-w-[100px] truncate">{{ folder.server_filename }}</span>
                        </template>
                    </div>

                    <div class="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                        <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                            <input type="checkbox" id="selectAll" :checked="isAllSelected" @change="toggleAll" 
                                class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                            <label for="selectAll" class="text-xs font-medium text-slate-600 cursor-pointer select-none">全选</label>
                            <span class="w-px h-3 bg-slate-300 mx-2"></span>
                            <span class="text-xs text-slate-500">已选 {{ selectedCount }} 项</span>
                        </div>
                        
                        <button @click="submitDownload" :disabled="selectedCount === 0 || processing"
                            class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium shadow-sm shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            <i v-if="processing" class="fa-solid fa-spinner fa-spin"></i>
                            <i v-else class="fa-solid fa-bolt"></i>
                            批量解析
                        </button>
                    </div>
                </div>

                <!-- Table -->
                <div class="flex-1 overflow-x-auto relative min-h-[400px]">
                    <div v-if="loadingDir" class="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
                        <div class="flex flex-col items-center gap-3">
                            <i class="fa-solid fa-circle-notch fa-spin text-indigo-500 text-3xl"></i>
                            <p v-if="loadingText" class="text-xs text-indigo-500 font-medium">{{ loadingText }}</p>
                        </div>
                    </div>

                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 sticky top-0 z-10">
                            <tr>
                                <th class="p-4 w-14 text-center"> </th>
                                <th class="p-4">文件名</th>
                                <th class="p-4 w-32">大小</th>
                                <th class="p-4 w-32 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-if="currentPath.length > 0" @click="goUp" class="hover:bg-slate-50 cursor-pointer group">
                                <td class="p-4 text-center"><i class="fa-solid fa-reply text-slate-300 group-hover:text-indigo-400"></i></td>
                                <td class="p-4" colspan="3"><span class="text-slate-500 group-hover:text-indigo-600 font-medium">.. 返回上一级</span></td>
                            </tr>

                            <tr v-for="file in currentList" :key="file.fs_id" 
                                class="group transition-colors"
                                :class="{'hover:bg-indigo-50/50': isSupported(file), 'bg-indigo-50/30': file.selected, 'opacity-60': !isSupported(file)}">
                                
                                <td class="p-4 text-center" :class="{'cursor-pointer': isSupported(file), 'cursor-not-allowed': !isSupported(file)}" @click.stop="handleSelectionClick(file)">
                                    <input type="checkbox" v-model="file.selected" :disabled="!isSupported(file)" @click.stop
                                        class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" 
                                        :class="{'cursor-pointer': isSupported(file)}">
                                </td>
                                
                                <td class="p-4 cursor-pointer" @click.stop="handleNameClick(file)">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 transition-colors" :class="getIconClass(file)">
                                            <i :class="getIcon(file)"></i>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="font-medium text-slate-700 group-hover:text-indigo-700 truncate max-w-[200px] sm:max-w-md select-none"
                                                  :class="{'text-slate-400': !isSupported(file)}">
                                                {{ file.server_filename }}
                                            </span>
                                            <span v-if="!isSupported(file)" class="text-[10px] text-red-400">文件过大 (>150MB)，不支持加速</span>
                                        </div>
                                    </div>
                                </td>
                                
                                <td class="p-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                                    {{ formatSize(file.size, file) }}
                                </td>
                                
                                <td class="p-4 text-center" @click.stop>
                                    <button v-if="isSupported(file) && !isFolder(file)" @click="downloadSingle(file)" 
                                        class="px-3 py-1 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-500 text-xs rounded transition-colors shadow-sm">
                                        <i class="fa-solid fa-bolt"></i> 解析
                                    </button>
                                    <span v-else-if="!isFolder(file)" class="text-xs text-slate-300 cursor-not-allowed">不支持</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="bg-slate-50 border-t border-slate-100 px-6 py-3 flex justify-between items-center text-xs text-slate-400">
                    <span class="flex items-center gap-1"><i class="fa-solid fa-info-circle"></i> 选中文件夹将自动递归获取内部文件</span>
                    <span>大于150M的文件将被自动跳过</span>
                </div>
            </div>
        </transition>

        <!-- Result Modal -->
        <transition name="modal">
            <div v-if="showResultModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showResultModal = false"></div>
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-download text-emerald-500"></i> 解析结果</h3>
                        <button @click="showResultModal = false" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                    </div>
                    
                    <div class="p-0 overflow-y-auto bg-slate-50/50 flex-1">
                        <!-- Errors -->
                        <div v-if="resultErrors.length > 0" class="p-4 bg-red-50 border-b border-red-100">
                            <h4 class="text-red-700 font-bold text-sm mb-2">部分文件处理失败:</h4>
                            <ul class="list-disc list-inside text-xs text-red-600 space-y-1">
                                <li v-for="(err, idx) in resultErrors" :key="idx">{{ err }}</li>
                            </ul>
                        </div>

                        <!-- Links -->
                        <div v-if="resultLinks.length > 0" class="divide-y divide-slate-100">
                            <div v-for="(item, idx) in resultLinks" :key="idx" class="p-4 hover:bg-white transition-colors">
                                <div class="flex justify-between items-start gap-4 mb-2">
                                    <div class="font-medium text-slate-700 break-all text-sm flex items-center gap-2">
                                        <span class="bg-emerald-100 text-emerald-600 text-[10px] px-1 rounded">PDF加速</span>
                                        <!-- 显示相对路径 -->
                                        <span :title="item.relativePath">{{ item.relativePath }}</span>
                                    </div>
                                    <span class="text-xs text-slate-400 whitespace-nowrap">{{ formatSize(item.size) }}</span>
                                </div>
                                
                                <div class="flex flex-col gap-2">
                                    <div class="relative">
                                        <input readonly :value="item.dlink" class="w-full bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-mono text-slate-600 focus:outline-none">
                                        <button @click="copyLink(item.dlink)" class="absolute right-1 top-1 bottom-1 px-2 bg-white border border-slate-200 rounded text-xs hover:bg-slate-50 text-slate-500">复制</button>
                                    </div>
                                    
                                    <div class="flex gap-2 mt-1">
                                        <button @click="openLink(item.dlink)" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-2 rounded-lg text-center font-medium shadow-sm shadow-emerald-100 transition-colors flex items-center justify-center gap-2">
                                            <i class="fa-solid fa-download"></i> 点击下载
                                        </button>
                                        <button @click="sendToLocalAria2(item)" class="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs py-2 rounded-lg font-medium transition-colors">
                                            <i class="fa-solid fa-paper-plane"></i> 推送 Aria2
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="resultErrors.length === 0" class="p-10 text-center text-slate-400">
                            无有效文件链接
                        </div>
                    </div>
                    
                     <!-- Batch Actions Footer -->
                    <div v-if="resultLinks.length > 0" class="px-6 py-3 border-t border-slate-100 bg-white flex justify-end gap-3">
                         <button @click="batchSendToAria2" class="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition flex items-center gap-2">
                            <i class="fa-solid fa-paper-plane"></i> 全部推送 Aria2
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Settings Modal -->
        <transition name="modal">
            <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showSettingsModal = false"></div>
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10">
                    <div class="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 class="font-bold text-slate-800">设置</h3>
                    </div>
                    <div class="p-6 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Baidu Cookie</label>
                            <textarea v-model="cookieConfig.bduss" rows="5" placeholder="BDUSS=...; STOKEN=..." 
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs font-mono"></textarea>
                            <p class="text-xs text-slate-400 mt-1">若留空，将自动轮询服务端预置的账号池。</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">本地 Aria2 RPC 地址</label>
                            <input type="text" v-model="cookieConfig.aria2Url" placeholder="http://localhost:6800/jsonrpc" 
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Aria2 Token</label>
                            <input type="password" v-model="cookieConfig.aria2Token" placeholder="RPC 密钥 (可选)" 
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm">
                        </div>
                    </div>
                    <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <button @click="showSettingsModal = false" class="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">取消</button>
                        <button @click="saveConfig" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm">保存</button>
                    </div>
                </div>
            </div>
        </transition>

    </div>

    <script>
        const { createApp, ref, computed, onMounted } = Vue;

        createApp({
            setup() {
                const link = ref('');
                const loading = ref(false);
                const loadingDir = ref(false);
                const loadingText = ref('');
                const processing = ref(false);
                const errorMsg = ref('');
                const hasData = ref(false);
                const showResultModal = ref(false);
                const showSettingsModal = ref(false);
                
                const shareData = ref({});
                const currentList = ref([]);
                const currentPath = ref([]);
                const dirCache = ref({});
                const resultLinks = ref([]);
                const resultErrors = ref([]);

                const cookieConfig = ref({
                    bduss: '',
                    aria2Url: 'http://localhost:6800/jsonrpc',
                    aria2Token: ''
                });

                onMounted(() => {
                    const saved = localStorage.getItem('baidu_worker_config');
                    if (saved) {
                        try { cookieConfig.value = JSON.parse(saved); } catch(e){}
                    }
                });

                const saveConfig = () => {
                    localStorage.setItem('baidu_worker_config', JSON.stringify(cookieConfig.value));
                    showSettingsModal.value = false;
                };

                const apiCall = async (endpoint, payload) => {
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.message || 'Unknown error');
                    return data;
                };

                const analyzeLink = async () => {
                    if (!link.value) return;
                    loading.value = true;
                    errorMsg.value = '';
                    hasData.value = false;
                    try {
                        const res = await apiCall('/api/analyze', { link: link.value });
                        shareData.value = { shareid: res.data.shareid, uk: res.data.uk, sekey: res.data.seckey || '' };
                        const list = res.data.list.map(mapFile);
                        dirCache.value['root'] = list;
                        currentList.value = list;
                        currentPath.value = [];
                        hasData.value = true;
                    } catch (e) {
                        errorMsg.value = '解析失败: ' + e.message;
                    } finally {
                        loading.value = false;
                    }
                };

                const loadDirectoryContent = async (folderPath) => {
                    // Always try fetch to ensure we have data, but checking cache first is standard.
                    // If user wants to "traverse inside" to populate cache, we just ensure the fetch happens.
                    if (dirCache.value[folderPath]) {
                        return dirCache.value[folderPath];
                    }
                    try {
                        const res = await apiCall('/api/list_dir', { link: link.value, dir: folderPath });
                        const list = res.data.list.map(mapFile);
                        dirCache.value[folderPath] = list;
                        return list;
                    } catch (e) {
                        console.error("List Dir Failed", e);
                        return null;
                    }
                };

                const runDownloadTask = async (files) => {
                     loadingDir.value = true; // Start Loading Overlay
                     
                     // Parse Phase
                     loadingText.value = '少女祈祷中 (过程可能较慢，请耐心等待)...';
                     processing.value = true;
                     resultLinks.value = [];
                     resultErrors.value = [];
                     
                     try {
                        const fs_ids = files.map(f => f.fs_id);
                        const res = await apiCall('/api/download', {
                            fs_ids: fs_ids,
                            share_data: shareData.value,
                            cookie: cookieConfig.value.bduss
                        });
                        
                        if (res.files) resultLinks.value.push(...res.files);
                        if (res.errors) resultErrors.value.push(...res.errors);
                        
                        showResultModal.value = true;
                        currentList.value.forEach(f => { f.selected = false; });
                     } catch(e) {
                        alert('Error: ' + e.message);
                     } finally {
                        processing.value = false;
                        loadingDir.value = false; // End Loading Overlay
                        loadingText.value = '';
                     }
                };

                const submitDownload = async () => {
                    const selectedFiles = currentList.value.filter(f => f.selected);
                    if (!selectedFiles.length) return;
                    await runDownloadTask(selectedFiles);
                };
                
                const downloadSingle = async (file) => {
                    await runDownloadTask([file]);
                };

                const batchSendToAria2 = async () => {
                    if (!resultLinks.value.length) return;
                    let count = 0;
                    for (const item of resultLinks.value) {
                        try {
                            await sendToLocalAria2Logic(item);
                            count++;
                        } catch(e) { console.error(e); }
                    }
                    alert(\`已发送 \${count} / \${resultLinks.value.length} 个任务\`);
                };

                const sendToLocalAria2Logic = async (item) => {
                    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0";
                    
                    // Use relativePath. If missing (root files), use filename.
                    const outPath = item.relativePath || item.filename;
                    
                    const payload = {
                        jsonrpc: '2.0',
                        method: 'aria2.addUri',
                        id: Date.now().toString(),
                        params: [
                            cookieConfig.value.aria2Token ? \`token:\${cookieConfig.value.aria2Token}\` : undefined,
                            [item.dlink],
                            { "out": outPath, "user-agent": ua }
                        ].filter(x => x !== undefined)
                    };
                    
                    const res = await fetch(cookieConfig.value.aria2Url, {
                        method: 'POST', 
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error.message);
                };

                const sendToLocalAria2 = async (item) => {
                    try {
                        await sendToLocalAria2Logic(item);
                        alert("已推送到本地 Aria2");
                    } catch(e) {
                        alert("推送失败: " + e.message + "\\n请检查本地 Aria2 配置或 Mixed Content 问题");
                    }
                };

                const openLink = (url) => {
                    window.open(url, '_blank', 'noopener,noreferrer');
                };

                const mapFile = (f) => ({ ...f, selected: false });
                const isFolder = (f) => f.isdir == 1;
                // PDF mode limit is 150MB
                const isSupported = (f) => isFolder(f) || f.size <= 157286400;

                const handleNameClick = async (file) => {
                    if (isFolder(file)) {
                        enterFolder(file);
                    } else if (isSupported(file)) {
                        file.selected = !file.selected;
                    }
                };
                
                const handleSelectionClick = (file) => {
                    if (isSupported(file)) {
                        file.selected = !file.selected;
                    }
                }
                
                const toggleSelection = (file) => {
                    if (isSupported(file)) {
                        file.selected = !file.selected;
                    }
                };

                const enterFolder = async (folder) => {
                    loadingDir.value = true;
                    try {
                        const list = await loadDirectoryContent(folder.path);
                        if (list) {
                            currentList.value = list;
                            currentPath.value.push(folder);
                        }
                    } finally {
                        loadingDir.value = false;
                    }
                };

                const goUp = async () => {
                    if (currentPath.value.length === 0) return;
                    currentPath.value.pop();
                    if (currentPath.value.length === 0) {
                        currentList.value = dirCache.value['root'];
                    } else {
                        const parent = currentPath.value[currentPath.value.length-1];
                        const list = await loadDirectoryContent(parent.path);
                        if(list) currentList.value = list;
                    }
                };
                
                const resetToRoot = () => {
                    currentList.value = dirCache.value['root'];
                    currentPath.value = [];
                };

                const toggleAll = () => {
                    const target = !isAllSelected.value;
                    currentList.value.forEach(f => {
                        if (isSupported(f)) {
                            f.selected = target;
                        }
                    });
                };

                const selectedCount = computed(() => currentList.value.filter(f => f.selected).length);
                const isAllSelected = computed(() => currentList.value.length > 0 && selectedCount.value === currentList.value.filter(isSupported).length);
                
                const formatSize = (bytes, file) => {
                    if (file && isFolder(file)) return '-';
                    if (bytes === undefined || bytes === null || isNaN(bytes)) return '-';
                    if (bytes === 0) return '0 B';
                    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };

                const getIcon = (file) => {
                    if (isFolder(file)) return 'fa-solid fa-folder';
                    const ext = (file.server_filename.split('.').pop() || '').toLowerCase();
                    const icons = {'zip':'fa-file-zipper','rar':'fa-file-zipper','pdf':'fa-file-pdf','mp4':'fa-file-video'};
                    return icons[ext] || 'fa-solid fa-file';
                };
                const getIconClass = (file) => {
                    if (isFolder(file)) return 'bg-amber-100 text-amber-500';
                    return 'bg-slate-100 text-slate-500';
                };
                const copyLink = (text) => { navigator.clipboard.writeText(text); };

                return {
                    link, loading, loadingDir, loadingText, processing, errorMsg, hasData,
                    currentList, currentPath, selectedCount, isAllSelected,
                    showResultModal, showSettingsModal, resultLinks, resultErrors, cookieConfig,
                    analyzeLink, submitDownload, downloadSingle, handleNameClick, handleSelectionClick, toggleSelection,
                    goUp, resetToRoot, toggleAll, formatSize, getIcon, getIconClass, isFolder, isSupported,
                    copyLink, saveConfig, sendToLocalAria2, batchSendToAria2, openLink
                };
            }
        }).mount('#app');
    </script>
</body>
</html>
`; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cookie, X-Requested-With",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        return new Response(HTML_CONTENT, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      if (url.pathname.startsWith("/api")) {
        if (request.method !== "POST") throw new Error("Method not allowed");
        const body = await request.json();
        
        const clientIP = "121.11.121.11";

        let responseData = {};
        if (url.pathname === "/api/analyze") responseData = await handleAnalyze(body);
        else if (url.pathname === "/api/list_dir") responseData = await handleListDir(body);
        else if (url.pathname === "/api/download") {
          env.SERVER_DEFAULT_COOKIES.forEach(c=>SERVER_DEFAULT_COOKIES.push(c));
          responseData = await handleDownload(body, clientIP);
        }
        else return new Response("Not Found", { status: 404, headers: corsHeaders });

        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response("Not Found", { status: 404 });

    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message, stack: e.stack }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

// --- Handlers ---

async function handleAnalyze(body) {
  const { link } = body;
  if (!link) throw new Error("Link is required");
  const { surl, pwd } = getShareInfo(link);
  
  // Static call, no client instance required for this logic
  const res = await BaiduDiskClient.getSharedList(surl, pwd);
  return { success: true, data: res.data };
}

async function handleListDir(body) {
  const { link, dir } = body;
  if (!link) throw new Error("Link is required");
  const { surl, pwd } = getShareInfo(link);
  
  // Static call
  const res = await BaiduDiskClient.getSharedList(surl, pwd, dir);
  return { success: true, data: res.data };
}

async function handleDownload(body, clientIP) {
  const { fs_ids, share_data, cookie } = body;
  if (!fs_ids || !share_data) throw new Error("Missing parameters");

  let client = null;
  let validCookieFound = false;

  // 1. Try User Cookie first
  if (cookie && cookie.trim().length > 0 && cookie.includes("BDUSS")) {
      client = new BaiduDiskClient(cookie, clientIP);
      if (await client.init()) {
          validCookieFound = true;
      }
  }

  // 2. Fallback to Server Cookies if user cookie failed or empty
  if (!validCookieFound) {
      if (!SERVER_DEFAULT_COOKIES || SERVER_DEFAULT_COOKIES.length === 0) {
          throw new Error("无可用 Cookie，请在设置中配置。");
      }
      
      // Iterate through pool
      for (const sCookie of SERVER_DEFAULT_COOKIES) {
          const tempClient = new BaiduDiskClient(sCookie, clientIP);
          if (await tempClient.init()) {
              client = tempClient;
              validCookieFound = true;
              break;
          }
      }
  }

  if (!validCookieFound || !client) {
      throw new Error("所有 Cookie 均失效，无法执行操作。");
  }

  // --- Logic Execution ---
  const transferDir = `/netdisk/${crypto.randomUUID()}`;
  const errors = [];
  const validFiles = [];

  try {
    // 3. Create Temp Directory
    await client.createDir(transferDir);

    // 4. Transfer Files
    try {
      await client.transferFiles(fs_ids, share_data.shareid, share_data.uk, share_data.sekey, transferDir);
    } catch (e) {
      await client.deleteFiles(["/netdisk"]); 
      await client.createDir(transferDir);
      await client.transferFiles(fs_ids, share_data.shareid, share_data.uk, share_data.sekey, transferDir);
    }

    // 5. Recursive List
    const localFiles = [];
    await recursiveListFiles(client, transferDir, localFiles);

    if (localFiles.length === 0) {
      throw new Error("No files found after transfer");
    }

    const filesToProcess = localFiles.map(f => f.path);
    const pathInfoMap = {};
    
    localFiles.forEach(f => {
      // Calculate relative path for Aria2
      let relative = f.path;
      if (f.path.startsWith(transferDir)) {
          relative = f.path.substring(transferDir.length + 1); // +1 to remove leading slash
      }
      
      pathInfoMap[f.path] = { 
          size: f.size, 
          filename: f.server_filename, 
          relativePath: relative 
      };
    });

    // 6. Processing Logic (PDF mode)
    const newPaths = [];

    for (const path of filesToProcess) {
      const info = pathInfoMap[path];
      
      if (info.size > 150 * 1024 * 1024) {
        errors.push(`Skipped ${info.filename}: Size > 150MB`);
        continue; 
      }

      const newPath = path + ".pdf";
      try {
        const renamed = await client.renameFile(path, info.filename + ".pdf");
        if (renamed) {
          newPaths.push(newPath);
          pathInfoMap[newPath] = info; 
        } else {
          errors.push(`Rename failed for ${info.filename}`);
        }
      } catch (e) {
        errors.push(`Rename error for ${info.filename}: ${e.message}`);
      }
    }

    // Wait for sync
    await new Promise(r => setTimeout(r, 1500));

    // Get Links
    for (const path of newPaths) {
      const info = pathInfoMap[path];
      try {
        const dlink = await client.getSmallFileLink(path);
        validFiles.push({
          path: path.slice(0, -4),
          dlink: dlink,
          size: info.size,
          filename: info.filename,
          relativePath: info.relativePath // Pass relative path to frontend
        });
      } catch (e) {
        errors.push(`Failed to get link for ${info.filename}: ${e.message}`);
      }
    }
    
    // 7. Global Cleanup
    await client.deleteFiles([transferDir]);

  } catch (e) {
    try { await client.deleteFiles([transferDir]); } catch(err) {}
    throw e;
  }

  return { success: true, files: validFiles, errors: errors };
}


// --- Helper Classes & Functions ---

function getShareInfo(link) {
  let surl = "", pwd = "";
  let m = link.match(/pan\.baidu\.com\/s\/([^\?&]+)/);
  if (m) surl = m[1];
  
  if (!surl) {
      m = link.match(/surl=([^&]+)/);
      if (m) surl = '1' + m[1];
  }

  m = link.match(/pwd=([^&#]+)/);
  if (m) pwd = m[1];

  if (!surl) throw new Error("Invalid Link");
  return { surl, pwd };
}

async function recursiveListFiles(client, dirPath, resultList) {
  if (resultList.length > 500) return; 

  const items = await client.listFiles(dirPath);
  for (const item of items) {
    if (item.isdir == 1) { 
      await recursiveListFiles(client, item.path, resultList);
    } else {
      resultList.push(item);
    }
  }
}

class BaiduDiskClient {
  constructor(cookie, clientIP) {
    this.cookie = cookie || "";
    this.clientIP = clientIP || "121.11.121.11";
    this.bdstoken = "";
    this.commonHeaders = {
      "User-Agent": DEFAULT_UA,
      "Cookie": this.cookie,
      "Referer": "https://pan.baidu.com/",
      "X-Forwarded-For": this.clientIP,
      "X-BS-Client-IP": this.clientIP,
      "X-Real-IP": this.clientIP
    };
  }

  async fetchJson(url, options = {}) {
    const headers = { ...this.commonHeaders, ...options.headers };
    const resp = await fetch(url, { ...options, headers });
    const data = await resp.json();
    return data;
  }

  async init() {
    // Requires cookie to be set
    const api = "https://pan.baidu.com/api/gettemplatevariable?clienttype=12&app_id=web=1&fields=[%22bdstoken%22,%22token%22,%22uk%22,%22isdocuser%22,%22servertime%22]";
    try {
      const data = await this.fetchJson(api);
      if (data.errno === 0 && data.result) {
        this.bdstoken = data.result.bdstoken;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // STATIC MERGED METHOD: getSharedList
  // Does not use instance state (cookies/IP)
  static async getSharedList(surl, pwd, dir = null) {
    const api = "https://pan.baidu.com/share/wxlist?channel=weixin&version=2.2.3&clienttype=25&web=1&qq-pf-to=pcqq.c2c";
    const formData = new FormData();
    formData.append("shorturl", surl);
    formData.append("pwd", pwd);
    
    if (dir) {
        formData.append("root", "0");
        formData.append("dir", dir);
    } else {
        formData.append("root", "1");
    }
    formData.append("page", "1");
    formData.append("number", "1000");
    formData.append("order", "time");

    // Standard headers for share page access (no auth required usually)
    const headers = {
        "User-Agent": "pan.baidu.com",
        "Cookie": "XFI=a5670f2f-f8ea-321f-0e65-2aa7030459eb; XFCS=945BEA7DFA30AC8B92389217A688C31B247D394739411C7F697F23C4660EB72F; XFT=42pBCS8fkYaJ0n4gDaF69yRvzWniWgJlXdBy81LXbh0=; csrfToken=jK3l7E6MvfRi1H2nWyosfO6C; BAIDUID=9943076555BFF404B749CCCBEC1EA355:FG=1; BDUSS=XBRv6R3A1AZMa49I27C0gDDLrJyxcIIeUZtBDIaHROBNUIGus13vk3BD9zda3BuRVFBQUFBJCQAAAAAAAAAAAEAAAD0D4SqeGluc2hpZGFptcS80gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADthI2c7YSNnR; BDUSS_BFESS=XBRv6R3A1AZMa49I27C0gDDLrJyxcIIeUZtBDIaHROBNUIGus13vk3BD9zda3BuRVFBQUFBJCQAAAAAAAAAAAEAAAD0D4SqeGluc2hpZGFptcS80gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADthI2c7YSNnR; STOKEN=b16e429c799f22abe9cb85a61a2e7a1623be5fbfba91d7ab436b82efe14f7d9f; BAIDUID_BFESS=9943076555BFF404B749CCCBEC1EA355:FG=1; ploganondeg=1; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2GrfqL8c87KLF2qFER3obJGnsqkZri/4OJbm7r4CyJIowGEimjy3MrXEpSuItnI4KD7cPaJi+EtbDcJgnQk/tNlLFexP6X2MFQoaSQy/vsh9sqhyAYQBt6m4RyCzt+5UgEJFLN5bHzZoV2zGsLtlJj5HGgLbz7OSojK1zRbqBESR5Pdk2R9IA3lxxOVzA+Iw1TWLSgWjlFVG9Xmh1+20oPSbrzvDjYtVPmZ+9/6evcXmhcO1Y58MgLozKnaQIaLfWRFwa8A3ZyTRp/cDxRMhYc94MJmBV3DqpyTuzDwSUDbMyyfzO9u0S9v0HHkJ/i4zKsdnTNS/pLMWceus0e757/UNkQhA4BJH1ZqCtXJJ8GJaKAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIYe0e8VVWSBjm4Ilwe4hu3MQsJWBnBSgEjmHQUFtOxdM0EAuvbfy2MtD0b26y0Li0ZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDg7JjsxZAfQoVAycJHizlQ5d34k8SzMID0x3kxnXwHfxXvz6DS3RnKydYTBUIWPYKJ4+L4IFygiJ3h+NYV6cyqffNZxCGhdRLPMuw9uS6j8+CIoJDOBjhPsojxAac1HLQgmicvCOZ5ilmUBt/wdqpvyAWuAFbMc1TpNbxQZiCF6/b1+SIlGdqadGFIFR1MMwbooKDbFUOPsQE72/a0kEWC2KhuPKLM9/6dZ00isWP1M71YVK+GcriYXdSGsdTLua2Z4rsiMpSciOy0GtH0BDIaHROBNUIGus13vk3BD9zddjzj9ZJseUlzwEV+bscicwIjSCwQvM4e3xnzVzlld+zvYN0q7Yw+xx5u95PSoz+nO88s9TqjpS2CuGXeoK3JV0ZszUm/I4svUtnuwoAeyS5LWqphVNhJG/707P2GcCYlcR4=; XFI=f7143350-cf68-11f0-8acd-61eeb95b95cf; XFCS=D12B94398162E859E99980DC2175A468BAE41F843F48A7B4D8C99595C2449E64; XFT=8NUZXyjrAxMQs1TDbyjegFt6n4leY0XmQOoTJcXdx34=; Hm_lvt_182d6d59474cf78db37e0b2248640ea5=1764671072; HMACCOUNT=CB7AC1AD9DBFA15B; Hm_lpvt_182d6d59474cf78db37e0b2248640ea5=1764681487; ndut_fmt=7F85A25ED79B99BF420EB77F4AC6F9F9CCBFC78FD26273CEFB05034A9364CCEE; BIDUPSID=9943076555BFF404B749CCCBEC1EA355; PSTM=1764682995; H_PS_PSSID=60279_63143_64314_65866_66124_66209_66233_66370_66289_66261_66393_66464_66529_66586_66594_65802_66615_66664_66681_66665_66697_66630_66775; BA_HECTOR=a1248laga400042l800h2l010lak2j1kitr7l24; ZFY=l3gDrwpkg2D8GkBbq:Bs4euDY:BcFItiLUz0OjoHkCMN4:C; BDRCVFR[feWj1Vr5u3D]=I67x6TjHwwYf0; PSINO=2; delPer=0; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; __bid_n=19adf4dab4660968afd8f0; H_WISE_SIDS=60279_63143_64314_65866_66124_66209_66233_66370_66289_66261_66393_66464_66529_66586_66594_65802_66615_66664_66681_66665_66697_66630_66775;"
    };

    const resp = await fetch(api, { method: "POST", body: formData, headers: headers });
    const data = await resp.json();
    if (data.errno !== 0) throw new Error(`List error: ${data.errno}`);
    return data;
  }

  async createDir(path) {
    const api = `https://pan.baidu.com/api/create?a=commit&clienttype=0&app_id=250528&web=1&bdstoken=${this.bdstoken}`;
    const formData = new FormData();
    formData.append("path", path);
    formData.append("isdir", "1");
    formData.append("block_list", "[]");
    
    const data = await this.fetchJson(api, { method: "POST", body: formData });
    if (data.errno !== 0) throw new Error(`Create dir failed: ${data.errno}`);
    return data.path;
  }

  async transferFiles(fsids, shareid, uk, sekey, destPath) {
    const api = `https://pan.baidu.com/share/transfer?shareid=${shareid}&from=${uk}&sekey=${sekey}&ondup=newcopy&async=1&channel=chunlei&web=1&app_id=250528&clienttype=0&bdstoken=${this.bdstoken}`;
    const formData = new FormData();
    formData.append("fsidlist", `[${fsids.join(',')}]`);
    formData.append("path", destPath);
    
    const data = await this.fetchJson(api, { method: "POST", body: formData });
    if (data.errno !== 0) throw new Error(`Transfer failed: ${data.errno} - ${data.show_msg || ''}`);
    return data;
  }

  async listFiles(dir) {
    const api = `https://pan.baidu.com/api/list?clienttype=0&app_id=250528&web=1&order=name&desc=0&dir=${encodeURIComponent(dir)}&num=1000&page=1`;
    const data = await this.fetchJson(api);
    if (data.errno !== 0) return [];
    return data.list || [];
  }

  async renameFile(path, newName) {
    const api = `https://pan.baidu.com/api/filemanager?opera=rename&async=2&onnest=fail&channel=chunlei&web=1&app_id=250528&clienttype=0&bdstoken=${this.bdstoken}`;
    const formData = new FormData();
    formData.append("filelist", JSON.stringify([{ path, newname: newName }]));
    
    const data = await this.fetchJson(api, { method: "POST", body: formData });
    return data.errno === 0;
  }

  async deleteFiles(paths) {
    const api = `https://pan.baidu.com/api/filemanager?opera=delete&async=2&onnest=fail&channel=chunlei&web=1&app_id=250528&clienttype=0&bdstoken=${this.bdstoken}`;
    const formData = new FormData();
    formData.append("filelist", JSON.stringify(paths));
    
    await this.fetchJson(api, { method: "POST", body: formData });
  }

  async getSmallFileLink(path) {
    const logid = btoa(crypto.randomUUID());
    const api = `https://pan.baidu.com/api/locatedownload?clienttype=0&app_id=250528&web=1&channel=chunlei&logid=${logid}&path=${encodeURIComponent(path)}&origin=pdf&use=1`;
    
    const headers = { ...this.commonHeaders, "User-Agent": PDF_UA };
    const resp = await fetch(api, { headers });
    const data = await resp.json();
    
    if (data.errno === 0) return data.dlink;
    throw new Error(`Errno ${data.errno}`);
  }
}
