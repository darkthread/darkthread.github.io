# 演算法 NP 問題

## 基礎
* **多項式時間 (Polynomial Time)**
  * 指時間複雜度不超過 O(n^k^)，例如：n³, n log n (n = 資料筆數)
  * O(2^n^)、O(n!) 為非多項式時間
    * 100 筆資料，2^100^ 到世界末日都算不完
* 問題分類
  * **決策問題 (Decision Problem)**
    * 回答是或否，若回答是，需給出解；回答否，需給出證明 
  * **最佳化問題 (Optimization Problem)**
    * 從有限答案中選出最佳解，通常比決策問題難
    * 例：最佳排班方式、最短路徑問題
* 最佳化問題可轉為決策問題
  * 例：最短路徑問題轉為「是否存在長度 < C 的路徑？」
* NP 問題主要聚焦決策問題

## Turing Machine 圖靈機
- 圖靈提出的抽象計算模型
  - 可計算所有在演算法中可計算的問題(Decidable Problem)
  - Undecidable Problem 例子
    - 停機問題 Halting Problem
    - 上帝數 Busy Beaver Function
- DTM vs NTM
  - Deterministic Turing Machine
    - 依據特定 State 及 Symbol 下一步只有一種可能
  - Non-Deterministic Turing Machine
    - 下一步分支出無限多種可能，直到任一分支達到 Halt State
    - 猜測並驗證答案，可同時選擇多個正確答案
    - 量子電腦雖有疊加態，但只會崩塌成單一結果，不是 NTM

## 關鍵術語
* **P 問題** 
  * P = Polynomial Time
  * 可用多項式時間複雜度演算法求解的問題
    * 用 DTM 在多項式時間內求解
    * Tractable 可解 vs Intractable 難解
    * Easy to Find
* **NP 問題** 
  * NP = Nondeterministic Polynomial Time
  * 可用多項式時間複雜度演算法驗證的問題
    * 用 DTM 在多項式時間內驗證
    * Easy to Check
    * 例：是否為質因數、拼圖/數獨結果
  * 不一定能用多項式時間複雜度演算法求解
  * P 問題一定是 NP 問題 (用解)
* Reduction 歸約
  * 將問題 A 轉換為問題 B 
    * A ≤ B 代表「問題 B 至少跟問題 A 一樣難」
    * 若 B 有多項式時間解，則 A 也有 
    * 若 A 沒有多項式時間解，則 B 也沒有
    * 歸約本身必須在多項式時間內完成
  * 將所有 NP 問題歸約成單一問題
    * 所有 NP 問題的難度都不高於此問題
    * 若該問題為 P 問題，則所有 NP 問題皆為 P 問題
* **NP-Hard**
  * 所有 NP 問題最後歸約成 NP-Hard 問題
  * 目前尚未找到多項式時間複雜度解法
  * 不一定能用多項式時間複雜度演算法驗證
    * 注意：NP-Hard 涵蓋非 NP 問題
* **NP-Complete** (NPC)
  * 所有 NP 問題可被歸約成 NP-Complete
    * 所有 NP 問題難度都不高於 NPC
  * 目前尚未找到多項式時間複雜度解法
  * 但可用多項式時間複雜度演算法驗證
    * 本身是一個 NP 問題
  * 一定可用 NTM 求解
    * 猜測所有正確解，用 DTM 在多項時間內驗證
    * 現實世界不存在 NTM
  * NPC 為 NP 及 NP-Hard 的交集

## P 與 NP 問題
* **解決問題** 與 **驗證答案** 難度不同
    * 驗證答案難度 ≤ 算出答案難度
    * 例：排序 vs 檢查順序正確
    * 例：拼圖、數獨、質因數分解
* **P 問題**：可在多項式時間內解決
* **NP 問題**：不確定是否可在多項式時間解決，但可在多項式時間內驗證 
* **P = NP ?** 
    * 若 P=NP，所有可驗證的問題都可被解決 
    * 若 P≠NP，有些可驗證的問題無法被解決
* 美國克雷數學研究所懸賞 100 萬美金，徵求勇者證明 P = NP 或 P ≠ NP 
* **Cook-Levin 理論**：任何 NP 決策問題都可在多項式時間內轉為「布林方程式是否存在解」
  * Boolean Satisfiability Problem - 簡稱 SAT 問題
  * 第一個 NPC 問題
* 解決任一 NPC 問題，即可證明 P=NP
  * 已發現上百個 NPC 問題
 
  
## 簡化好記版
* **P**：有簡單解法 
  * 簡單或困難以多項式時間複雜度為判定標準
* **NP**：有簡單驗證方法
* **NPC**：歸約所有 NP 問題
  * 具 NP 性質
  * 有簡單驗證法，不一定有簡單解法
* **NP-Hard**：歸約所有 NP 問題，但無簡單解法與驗證法

