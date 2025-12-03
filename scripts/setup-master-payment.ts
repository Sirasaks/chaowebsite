import * as dotenv from 'dotenv';
dotenv.config();
import pool from "../src/lib/db";

async function main() {
    const connection = await pool.getConnection();
    try {
        console.log("Setting up Master Payment Tables...");

        // 1. Create master_topup_history table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS master_topup_history (
                id int(11) NOT NULL AUTO_INCREMENT,
                user_id int(11) NOT NULL,
                trans_ref varchar(255) NOT NULL,
                amount decimal(10, 2) NOT NULL,
                sender_name varchar(255) DEFAULT NULL,
                receiver_name varchar(255) DEFAULT NULL,
                status varchar(50) DEFAULT 'completed',
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                UNIQUE KEY trans_ref (trans_ref),
                KEY idx_master_topup_user_id (user_id),
                CONSTRAINT master_topup_history_ibfk_1 FOREIGN KEY (user_id) REFERENCES master_users (id) ON DELETE CASCADE
            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
        `);
        console.log("Created master_topup_history table.");

        // 2. Insert Default Payment Settings into master_settings
        const defaultSettings = [
            { key: 'bank_transfer_enabled', value: 'true' },
            { key: 'truemoney_angpao_enabled', value: 'true' },
            { key: 'bank_name', value: 'KBank' },
            { key: 'bank_account_number', value: '123-4-56789-0' },
            { key: 'bank_account_name', value: 'Master Company Ltd.' },
            { key: 'truemoney_phone', value: '0812345678' },
            { key: 'slipok_api_key', value: 'placeholder_api_key' },
            { key: 'slipok_branch_id', value: 'placeholder_branch_id' },
        ];

        for (const setting of defaultSettings) {
            await connection.query(`
                INSERT INTO master_settings (setting_key, setting_value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            `, [setting.key, setting.value]);
        }
        console.log("Inserted default payment settings.");

    } catch (error) {
        console.error("Error setup master payment:", error);
    } finally {
        connection.release();
        process.exit();
    }
}

main();
