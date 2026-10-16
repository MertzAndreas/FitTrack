namespace FitTrack.Api;

/// <summary>Body data for a day. Measurements and photos replace wholesale on save.</summary>
public record WeightEntryRequest(
    string Date,
    double WeightKg,
    List<MeasurementRequest>? Measurements);

public record MeasurementRequest(string Kind, double ValueCm);

public record WeightEntryResponse(
    string Date,
    double WeightKg,
    List<MeasurementResponse> Measurements,
    List<PhotoResponse> Photos);

public record MeasurementResponse(string Kind, double ValueCm);

public record PhotoResponse(int Id, string Url);
