using Backend.Models;

namespace Backend.Feature.Weight;

public record CreateMeasurement(MeasurementSite Site, double LengthCm);

public record UpsertWeightEntryForm(
    DateOnly Date,
    double WeightKg,
    string MeasurementsJson, // CreateMeasurement
    IFormFileCollection? Photos
);

public record MeasurementSiteDto(int Id, string Name);

public record MeasurementDto(int Id, MeasurementSite Site, string Name, double LengthCm);

public record WeightPhotoDto(int Id);

public record WeightEntryDto(
    int Id,
    DateOnly Date,
    double WeightKg,
    IReadOnlyList<MeasurementDto> Measurements,
    IReadOnlyList<WeightPhotoDto> Photos
);
