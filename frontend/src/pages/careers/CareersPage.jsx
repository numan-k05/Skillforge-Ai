import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx";
import CareerCard from "../../components/careers/CareerCard.jsx";
import { CareerLoading, CareerError, CareerEmpty } from "../../components/careers/CareerStatus.jsx";
import * as careerApi from "../../services/careerService.js";
import { ApiError } from "../../services/apiClient.js";
import "./CareersPage.css";

/**
 * Fetches the full category list and full career list once on mount,
 * then filters both by category and search term entirely client-side.
 * This keeps the page responsive on every keystroke without issuing a
 * new API request per interaction — the backend does support
 * ?categoryId= server-side filtering, but the whole catalog is small
 * enough that one fetch covers every filter combination.
 */
export default function CareersPage() {
  const [categories, setCategories] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const requestVersion = useRef(0);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try {
      const [categoryList, careerList] = await Promise.all([
        careerApi.getCareerCategories(),
        careerApi.getCareers(),
      ]);
      commit(() => setError(null));

      commit(() => setCategories(categoryList));
      commit(() => setCareers(careerList));
    } catch (err) {
      commit(() => setError(err instanceof ApiError ? err : new ApiError(0, "Could not load careers.")));
    } finally {
      commit(() => setLoading(false));
    }
  }, []);
  function load() {
    setLoading(true);
    setError(null);
    return fetchData();
  }

  useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);

  const filteredCareers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return careers.filter((career) => {
      const matchesCategory =
        selectedCategoryId == null || career.category?.categoryId === selectedCategoryId;
      const matchesSearch =
        term.length === 0 ||
        career.title.toLowerCase().includes(term) ||
        (career.shortDescription || "").toLowerCase().includes(term) ||
        (career.category?.name || "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [careers, searchTerm, selectedCategoryId]);

  return (
    <div>
      <AppNav />
      <div className="container sf-careers">
        <div className="sf-careers__header">
          <p className="sf-careers__eyebrow mono">Career Explorer</p>
          <h1>Explore Careers</h1>
          <p className="sf-careers__subtitle">
            Browse the careers SkillForge AI supports and discover exactly which skills each one
            requires.
          </p>
        </div>

        {!loading && !error && (
          <div className="sf-careers__controls">
            <label className="sf-careers__search" htmlFor="career-search">
              <Search size={16} aria-hidden="true" />
              <span className="visually-hidden">Search careers</span>
              <input
                id="career-search"
                type="text"
                placeholder="Search careers, e.g. &quot;designer&quot; or &quot;data&quot;"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>

            <div className="sf-careers__chips" role="group" aria-label="Filter by category">
              <button
                type="button"
                className={`sf-careers__chip${selectedCategoryId == null ? " sf-careers__chip--active" : ""}`}
                onClick={() => setSelectedCategoryId(null)}
              >
                All Careers
              </button>
              {categories.map((category) => (
                <button
                  key={category.categoryId}
                  type="button"
                  className={`sf-careers__chip${
                    selectedCategoryId === category.categoryId ? " sf-careers__chip--active" : ""
                  }`}
                  onClick={() => setSelectedCategoryId(category.categoryId)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <CareerLoading />}

        {!loading && error && (
          <CareerError message={error.message} onAction={load} actionLabel="Try again" />
        )}

        {!loading && !error && filteredCareers.length === 0 && (
          <CareerEmpty
            message={
              searchTerm || selectedCategoryId != null
                ? "No careers match your search or filter."
                : "No careers are available yet."
            }
          />
        )}

        {!loading && !error && filteredCareers.length > 0 && (
          <div className="sf-careers__grid">
            {filteredCareers.map((career) => (
              <CareerCard key={career.careerId} career={career} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
