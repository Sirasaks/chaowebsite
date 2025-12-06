
async function verifyDeletedShopContent() {
    console.log("🔒 Verifying Deleted Shop Content...\n");

    const deletedShop = 'non-existent-shop';
    const url = `http://127.0.0.1:3000/`;

    console.log(`🎯 Target: ${deletedShop}.localhost:3000`);

    try {
        const res = await fetch(url, {
            headers: {
                'Host': `${deletedShop}.localhost:3000`,
                'x-shop-subdomain': deletedShop
            }
        });

        console.log(`   Status: ${res.status}`);
        const text = await res.text();

        if (res.status === 404) {
            console.log("✅ PASS: Status is 404.");
            if (text.includes("Could not find requested resource")) {
                console.log("✅ PASS: Content matches custom Not Found page.");
            } else {
                console.log("⚠️  WARNING: Content does not match custom Not Found page.");
                console.log("Preview:", text.substring(0, 200));
            }
        } else {
            console.log(`❌ FAIL: Status ${res.status}.`);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

verifyDeletedShopContent();
