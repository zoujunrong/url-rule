// Init rules
getStorageSyncData(["switch-status", "http-list"]).then(items => {
    if (items["switch-status"] === undefined) {
        chrome.storage.sync.set({'switch-status': true})
    }
    if (items["switch-status"] === undefined || items["switch-status"]) {
        addRules(items["http-list"])
    }
});

function getStorageSyncData(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        if (keys.length == 1) {
            items = items[keys]
        }
        resolve(items);
      });
    });
}

chrome.storage.onChanged.addListener(function(obj) {
    for (k in obj) {
        if (k == 'switch-status') {
            if (obj[k].newValue) {
                getStorageSyncData(["http-list"]).then(val => {
                    addRules(val)
                })
            } else {
                removeRules()
            }
        } else if (k == 'http-list') {
            removeRules().then(val => {
                addRules(obj[k].newValue)
            })
        }
    }
})


function addRules(rules) {
    if (!rules) return
    parses = rules.split(/[\s\n;]/)
    let addRules = []
    let removeRuleIds = []
    parses.forEach((domain, index) => {
        if (!domain) return
        let id = index + 1
        removeRuleIds.push(id)
        addRules.push(
            {
                "id": id,
                "priority": 1,
                "action": {
                    "type": "redirect",
                    "redirect": {
                    "transform": { "scheme": "http"}
                    }
                },
                "condition": {
                    "urlFilter": "https://"+domain,
                    "resourceTypes": ["main_frame"]
                }
            }
        )
    })

    chrome.declarativeNetRequest.updateDynamicRules({addRules, removeRuleIds})

}

function removeRules() {
    return new Promise((resolve, reject) => {
        chrome.declarativeNetRequest.getDynamicRules(
            function(items) {
                let ids = []
                items.forEach(function(item) {
                    ids.push(item.id)
                })
                chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds: ids}, function() {
                    resolve(ids);
                })
            }
        )
    });
}