#include <iostream>
#include <regex>
#include <limits>
#include "sqlite3.h"

using namespace std;


bool validPassword(string password) {
    return password.length() >= 8;
}


bool validDateTime(string datetime) {
    if (datetime.length() != 16) return false;

    // FORMAT BARU: DD-MM-YYYY HH:MM
    regex pattern(R"(^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$)");
    return regex_match(datetime, pattern);
}


bool userExists(sqlite3 *db, string username) {
    string sql = "SELECT id FROM users WHERE username='" + username + "';";
    sqlite3_stmt *stmt;

    sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, NULL);
    bool exists = (sqlite3_step(stmt) == SQLITE_ROW);
    sqlite3_finalize(stmt);

    return exists;
}


void registerUser(sqlite3 *db) {
    string username, password;

    cout << "Username: ";
    cin >> username;

    do {
        cout << "Password: ";
        cin >> password;

        if (!validPassword(password)) {
            cout << "❌ Password minimal 8 karakter.\n";
        }

    } while (!validPassword(password));

    string sql = "INSERT INTO users (username, password) VALUES ('" 
                + username + "', '" + password + "');";

    if (sqlite3_exec(db, sql.c_str(), 0, 0, 0) != SQLITE_OK) {
        cout << "❌ Username sudah digunakan!\n";
    } else {
        cout << "✅ Register berhasil!\n";
    }
}


int loginUser(sqlite3 *db) {
    string username, password;

    while (true) {
        cout << "Username: ";
        cin >> username;

        if (!userExists(db, username)) {
            cout << "⚠️ Username belum terdaftar.\n";
            cout << "1. Coba lagi\n2. Register\n3. Kembali\nPilih: ";

            int pilih;
            cin >> pilih;

            if (pilih == 2) {
                registerUser(db);
                return -1; 
            }
            else if (pilih == 3) {
                return -1;
            }

            continue;
        }

        cout << "Password: ";
        cin >> password;

        if (!validPassword(password)) {
            cout << "❌ Password minimal 8 karakter.\n";
            continue;
        }

        string sql = "SELECT id FROM users WHERE username='" + username +
                     "' AND password='" + password + "';";

        sqlite3_stmt *stmt;
        sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, NULL);

        if (sqlite3_step(stmt) == SQLITE_ROW) {
            int user_id = sqlite3_column_int(stmt, 0);
            cout << "✅ Login berhasil!\n";
            sqlite3_finalize(stmt);
            return user_id;
        }

        cout << "❌ Password salah.\n";
        sqlite3_finalize(stmt);
    }
}


void tambahTugas(sqlite3 *db, int user_id) {
    string judul, deadline;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    cout << "Judul tugas   : ";
    getline(cin, judul);

    do {
        cout << "Deadline (DD-MM-YYYY HH:MM) : ";
        getline(cin, deadline);

        if (!validDateTime(deadline)) {
            cout << "❌ Format salah!\n";
            cout << "Gunakan: 01-05-2026 14:30\n";
        }

    } while (!validDateTime(deadline));

    string sql = "INSERT INTO tasks (user_id, judul, deadline, status) VALUES (" 
                + to_string(user_id) + ", '" + judul + "', '" + deadline + "', 'Belum');";

    if (sqlite3_exec(db, sql.c_str(), 0, 0, 0) == SQLITE_OK) {
        cout << "✅ Tugas berhasil ditambahkan!\n";
    } else {
        cout << "❌ Gagal tambah tugas!\n";
    }
}


int callback(void *data, int argc, char **argv, char **azColName) {
    int *count = (int*)data;
    (*count)++;

    cout << "----------------------------------------\n";
    cout << "ID       : " << (argv[0] ? argv[0] : "NULL") << endl;
    cout << "Judul    : " << (argv[2] ? argv[2] : "NULL") << endl;
    cout << "Deadline : " << (argv[3] ? argv[3] : "NULL") << " WIB" << endl;
    cout << "Status   : " << (argv[4] ? argv[4] : "NULL") << endl;

    return 0;
}


void tampilkanTugas(sqlite3 *db, int user_id) {
    cout << "\n========== TUGAS ANDA ==========\n";

    string sql = "SELECT * FROM tasks WHERE user_id=" + to_string(user_id) + ";";

    int count = 0;
    sqlite3_exec(db, sql.c_str(), callback, &count, 0);

    if (count == 0) {
        cout << "⚠️ Belum ada tugas.\n";
    }
}


void hapusTugasTerakhir(sqlite3 *db, int user_id) {
    string sqlGet = "SELECT id FROM tasks WHERE user_id=" + to_string(user_id) + " ORDER BY id DESC LIMIT 1;";
    sqlite3_stmt *stmt;

    sqlite3_prepare_v2(db, sqlGet.c_str(), -1, &stmt, NULL);

    if (sqlite3_step(stmt) == SQLITE_ROW) {
        int id = sqlite3_column_int(stmt, 0);

        string sqlDelete = "DELETE FROM tasks WHERE id=" + to_string(id) + ";";
        sqlite3_exec(db, sqlDelete.c_str(), 0, 0, 0);

        cout << "🗑️ Tugas terakhir dihapus!\n";
    } else {
        cout << "⚠️ Tidak ada tugas\n";
    }

    sqlite3_finalize(stmt);
}


void ubahStatus(sqlite3 *db, int user_id) {
    int id, pilihan;

    cout << "Masukkan ID tugas: ";
    cin >> id;

    cout << "1. Belum\n2. Selesai\nPilih: ";
    cin >> pilihan;

    string status = (pilihan == 2) ? "Selesai" : "Belum";

    string sql = "UPDATE tasks SET status='" + status +
                 "' WHERE id=" + to_string(id) +
                 " AND user_id=" + to_string(user_id) + ";";

    sqlite3_exec(db, sql.c_str(), 0, 0, 0);

    cout << "✅ Status berhasil diubah!\n";
}


int main() {
    sqlite3 *db;
    sqlite3_open("test.db", &db);

    sqlite3_exec(db,
        "CREATE TABLE IF NOT EXISTS tasks ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user_id INTEGER,"
        "judul TEXT,"
        "deadline TEXT,"
        "status TEXT);",
        0, 0, 0);

    sqlite3_exec(db,
        "CREATE TABLE IF NOT EXISTS users ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "username TEXT UNIQUE,"
        "password TEXT);",
        0, 0, 0);

    while (true) {
        int user_id = -1;

    
        while (true) {
            int pilih;
            cout << "\n========== MENU LOGIN ==========\n";
            cout << "1. Login\n2. Register\n3. Keluar\nPilih: ";
            cin >> pilih;

            if (pilih == 1) {
                user_id = loginUser(db);
                if (user_id != -1) break;
            }
            else if (pilih == 2) {
                registerUser(db);
            }
            else if (pilih == 3) {
                sqlite3_close(db);
                return 0;
            }
        }

        
        int menu;
        do {
            cout << "\n========== MENU REMINDER ==========\n";
            cout << "1. Tambah Tugas\n";
            cout << "2. Tampilkan Tugas\n";
            cout << "3. Hapus Tugas Terakhir\n";
            cout << "4. Ubah Status\n";
            cout << "5. Logout\n";
            cout << "Pilih: ";
            cin >> menu;

            switch (menu) {
                case 1: tambahTugas(db, user_id); break;
                case 2: tampilkanTugas(db, user_id); break;
                case 3: hapusTugasTerakhir(db, user_id); break;
                case 4: ubahStatus(db, user_id); break;
            }

        } while (menu != 5);

        cout << "🔓 Logout berhasil!\n";
    }

    sqlite3_close(db);
    return 0;
}